"""Runs the code cells of update_posts_tables.ipynb here, so the tables in this folder update in place.

    python run_update.py

Needs OPENAI_API_KEY in the environment when there are new posts to describe and judge.
"""
import json
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
with open('update_posts_tables.ipynb', encoding='utf-8') as f:
    notebook = json.load(f)
code = '\n\n'.join(''.join(cell['source']) if isinstance(cell['source'], list) else cell['source']
                   for cell in notebook['cells'] if cell['cell_type'] == 'code')
exec(compile(code, 'update_posts_tables.ipynb', 'exec'), {'__name__': '__main__'})
