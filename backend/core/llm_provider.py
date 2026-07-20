import os
import asyncio
import structlog
from typing import Type, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

logger = structlog.get_logger()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-3.5-flash")

# Transient error codes that should be retried
TRANSIENT_ERROR_CODES = [500, 502, 503, 504]
MAX_RETRIES = 3


class LLMError(Exception):
    """Structured error for LLM failures."""
    def __init__(self, message: str, provider: str, error_type: str = "unknown"):
        self.message = message
        self.provider = provider
        self.error_type = error_type
        super().__init__(f"[{provider}] {error_type}: {message}")


async def call_llm(system_prompt: str, user_prompt: str, response_format: Type[T]) -> T:
    """
    Unified LLM call that supports multiple providers.
    Returns parsed Pydantic model or raises LLMError.
    """
    if LLM_PROVIDER == "gemini":
        return await _call_gemini(system_prompt, user_prompt, response_format)
    elif LLM_PROVIDER == "openai":
        return await _call_openai(system_prompt, user_prompt, response_format)
    else:
        raise LLMError(f"Unknown provider: {LLM_PROVIDER}", LLM_PROVIDER, "config")


def _is_transient_error(error_msg: str) -> bool:
    """Check if error is a transient server error that should be retried."""
    error_lower = error_msg.lower()
    for code in TRANSIENT_ERROR_CODES:
        if f"{code}" in error_lower or f"unavailable" in error_lower:
            return True
    return False

def _is_quota_exhausted(error_msg: str) -> bool:
    """Check if error is a quota exhaustion error (non-retryable)."""
    error_lower = error_msg.lower()
    return "429" in error_lower or "resource_exhausted" in error_lower or "quota" in error_lower

def _extract_quota_info(error_msg: str) -> dict:
    """Extract quota information from error message if present."""
    import re
    info = {}
    
    # Try to extract retry delay
    retry_match = re.search(r'retryDelay["\s:]+(\d+)', error_msg)
    if retry_match:
        info["retry_delay_seconds"] = int(retry_match.group(1))
    
    # Try to extract quota metric
    metric_match = re.search(r'quotaMetric["\s:]+([^"]+)', error_msg)
    if metric_match:
        info["quota_metric"] = metric_match.group(1)
    
    # Try to extract quota id
    id_match = re.search(r'quotaId["\s:]+([^"]+)', error_msg)
    if id_match:
        info["quota_id"] = id_match.group(1)
    
    return info


async def _call_gemini(system_prompt: str, user_prompt: str, response_format: Type[T]) -> T:
    """Call Google Gemini with structured output and retry logic."""
    if not GOOGLE_API_KEY:
        raise LLMError("GOOGLE_API_KEY not set", "gemini", "config")
    
    # Build the prompt with schema instructions
    schema_instructions = f"""
Respond with valid JSON matching this schema:
{response_format.model_json_schema()}

Do not include any other text. Output only the JSON object.
"""
    
    full_prompt = f"{system_prompt}\n\n{user_prompt}\n\n{schema_instructions}"
    
    # Log the full prompt for debugging (truncated to avoid huge logs)
    logger.info(
        "gemini_prompt",
        model=LLM_MODEL,
        prompt_length=len(full_prompt),
        available_files_in_prompt="AVAILABLE REPOSITORY FILES" in full_prompt
    )
    
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=GOOGLE_API_KEY)
            
            logger.info(f"gemini_request_attempt", attempt=attempt)
            
            response = client.models.generate_content(
                model=LLM_MODEL,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_format,
                )
            )
            
            # Parse the response
            if response.text:
                logger.info("gemini_request_success", attempt=attempt)
                return response_format.model_validate_json(response.text)
            else:
                raise LLMError("Empty response from Gemini", "gemini", "empty_response")
                
        except ImportError:
            raise LLMError("google-genai package not installed", "gemini", "import")
        except Exception as e:
            error_msg = str(e)
            last_error = e
            
            # Check if this is a quota exhaustion error (non-retryable)
            if _is_quota_exhausted(error_msg):
                quota_info = _extract_quota_info(error_msg)
                logger.error(
                    "gemini_quota_exhausted",
                    model=LLM_MODEL,
                    quota_info=quota_info,
                    error=error_msg
                )
                raise LLMError(
                    f"Gemini daily free-tier quota exhausted. "
                    f"Configure another provider or wait until quota resets. "
                    f"Details: {error_msg}",
                    "gemini",
                    "quota_exhausted"
                )
            
            # Check if this is a transient error
            if _is_transient_error(error_msg) and attempt < MAX_RETRIES:
                wait_time = 2 ** (attempt - 1)  # Exponential backoff: 1, 2, 4 seconds
                logger.warning(
                    "gemini_request_retry",
                    attempt=attempt,
                    error=error_msg,
                    wait_seconds=wait_time
                )
                await asyncio.sleep(wait_time)
                continue
            
            # Non-transient error or exhausted retries
            error_type = "api"
            if "quota" in error_msg.lower() or "rate" in error_msg.lower():
                error_type = "rate_limit"
            elif "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
                error_type = "auth"
            elif "not found" in error_msg.lower() or "404" in error_msg.lower():
                error_type = "not_found"
            
            if attempt >= MAX_RETRIES:
                error_type = "unavailable"
            
            raise LLMError(error_msg, "gemini", error_type)
    
    # Should not reach here, but just in case
    raise LLMError(f"Gemini unavailable after {MAX_RETRIES} attempts", "gemini", "unavailable")


async def _call_openai(system_prompt: str, user_prompt: str, response_format: Type[T]) -> T:
    """Call OpenAI with structured output (legacy support)."""
    if not OPENAI_API_KEY:
        raise LLMError("OPENAI_API_KEY not set", "openai", "config")
    
    try:
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        completion = await client.beta.chat.completions.parse(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=response_format,
            temperature=0.0
        )
        
        return completion.choices[0].message.parsed
        
    except Exception as e:
        error_msg = str(e)
        error_type = "api"
        if "quota" in error_msg.lower() or "rate" in error_msg.lower():
            error_type = "rate_limit"
        elif "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            error_type = "auth"
        raise LLMError(error_msg, "openai", error_type)