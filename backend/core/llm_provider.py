import os
import structlog
from typing import Type, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

logger = structlog.get_logger()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash-lite")


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


async def _call_gemini(system_prompt: str, user_prompt: str, response_format: Type[T]) -> T:
    """Call Google Gemini with structured output."""
    if not GOOGLE_API_KEY:
        raise LLMError("GOOGLE_API_KEY not set", "gemini", "config")
    
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GOOGLE_API_KEY)
        
        # Build the prompt with schema instructions
        schema_instructions = f"""
Respond with valid JSON matching this schema:
{response_format.model_json_schema()}

Do not include any other text. Output only the JSON object.
"""
        
        full_prompt = f"{system_prompt}\n\n{user_prompt}\n\n{schema_instructions}"
        
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
            return response_format.model_validate_json(response.text)
        else:
            raise LLMError("Empty response from Gemini", "gemini", "empty_response")
            
    except ImportError:
        raise LLMError("google-genai package not installed", "gemini", "import")
    except Exception as e:
        error_msg = str(e).lower()
        if "quota" in error_msg or "rate" in error_msg:
            error_type = "rate_limit"
        elif "api_key" in error_msg or "unauthorized" in error_msg:
            error_type = "auth"
        else:
            error_type = "api"
        raise LLMError(str(e), "gemini", error_type)


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
        error_msg = str(e).lower()
        if "quota" in error_msg or "rate" in error_msg:
            error_type = "rate_limit"
        elif "api_key" in error_msg or "unauthorized" in error_msg:
            error_type = "auth"
        else:
            error_type = "api"
        raise LLMError(str(e), "openai", error_type)