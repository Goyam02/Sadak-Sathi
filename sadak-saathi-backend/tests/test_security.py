import os
import glob
import re

def test_env_and_code_do_not_contain_prod_secrets():
    """Scan for patterns that resemble leaked DB secrets in .env and .py files."""
    danger_patterns = [
        r"postgres(?:ql)?://[\w\-]+:[^@]+@[^\s\'\"]+",              # PostgreSQL URLs with passwords
        r"npg_[A-Za-z0-9]+",                                             # NeonDB password tokens
        r"ep-[a-z\-0-9]+\.neon\.tech",                                # Neon endpoints
        r"password=?(?:[\w\d]+)?",                                     # "password" literal with assignment
        r"NEONDB_URL.*=[^<]*\w+",                                      # Env line with actual value
    ]
    root = os.path.dirname(os.path.dirname(__file__))
    to_search = glob.glob(os.path.join(root, "**/*.env"), recursive=True)
    to_search += glob.glob(os.path.join(root, "**/*.py"), recursive=True)
    forbidden = []
    for fname in to_search:
        with open(fname) as f:
            content = f.read()
            for patt in danger_patterns:
                if re.search(patt, content):
                    forbidden.append((fname, patt))
    assert not forbidden, f"Production secret found in: {forbidden}. Remove before deploy."
