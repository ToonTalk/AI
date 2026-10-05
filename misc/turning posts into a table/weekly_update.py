"""The weekly job: pull, update the tables, and commit + push them if anything changed.

    python weekly_update.py

Run by the Claude scheduled task "weekly-research-posts-tables" (Mondays 6am).
Needs OPENAI_API_KEY in the environment when there are new posts.
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TABLE_FILES = ['ken_kahn_posts.json', 'ken_kahn_posts.html', 'apps_with_AI.html', 'broken_links_report.html']


def git(*args):
    result = subprocess.run(['git', *args], cwd=HERE, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        sys.exit(f"❌ git {' '.join(args)} failed:\n{result.stdout}{result.stderr}")
    return result.stdout


sys.stdout.reconfigure(encoding='utf-8')
git('pull', '--ff-only', 'origin', 'main')

env = {**os.environ, 'PYTHONIOENCODING': 'utf-8'}
run = subprocess.run([sys.executable, 'run_update.py'], cwd=HERE, capture_output=True, text=True,
                     encoding='utf-8', env=env)
output = '\n'.join(line for line in run.stdout.splitlines() if not line.startswith('✅ ') or 'up to date' in line)
print(output)
if run.returncode != 0:
    sys.exit(f"❌ run_update.py failed:\n{run.stderr[-3000:]}")

changed = [f for f in TABLE_FILES if os.path.exists(os.path.join(HERE, f)) and git('status', '--porcelain', '--', f).strip()]
if not changed:
    print("\nNothing to commit.")
    sys.exit(0)

match = re.search(r'Summary: \d+ posts — (\d+) new', output)
new = int(match.group(1)) if match else 0
git('add', '--', *changed)
git('commit', '-m', f"Weekly update of research post tables ({new} new post{'' if new == 1 else 's'})\n\n"
                     "Co-Authored-By: Claude <noreply@anthropic.com>", '--', *changed)
git('push', 'origin', 'main')
print(f"\n✅ Committed and pushed {git('rev-parse', '--short', 'HEAD').strip()}: {', '.join(changed)}")
