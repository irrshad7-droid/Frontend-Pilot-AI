import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "pilot.db")

def init_db():
    with get_db() as conn:
        conn.execute('''
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.execute('''
        CREATE TABLE IF NOT EXISTS issues (
            id TEXT PRIMARY KEY,
            run_id TEXT,
            title TEXT,
            component_path TEXT,
            dom_snapshot_url TEXT,
            confidence_score INTEGER,
            explanation TEXT,
            evidence TEXT,
            status TEXT
        )
        ''')
        
        conn.execute('''
        CREATE TABLE IF NOT EXISTS patches (
            id TEXT PRIMARY KEY,
            issue_id TEXT,
            diff_content TEXT,
            confidence_score INTEGER,
            explanation TEXT,
            evidence TEXT,
            verification_status TEXT
        )
        ''')

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.commit()
        conn.close()

if __name__ == "__main__":
    init_db()
