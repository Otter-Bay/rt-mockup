"""Run before every push that changes the mock-up:  python3 tools/release.py

Sets one build number (the current Pacific date and time) in:
  - version.json (the file the app checks on every launch, never cached), and
  - every app page: window.BUILD and every ?v= on its scripts and stylesheets.
When someone opens an older cached copy (Discord's built-in browser keeps pages a while),
the page sees a newer build in version.json and reloads itself once with a fresh address,
so the latest version shows up with no ?fresh=1 or closing Discord.
"""
import datetime, json, re, pathlib, zoneinfo
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html", "sds/index.html", "rpsgt/index.html", "cna/index.html"]
build = datetime.datetime.now(zoneinfo.ZoneInfo("America/Los_Angeles")).strftime("%Y%m%d%H%M")
CHECK = ('<script>window.BUILD = "{b}"; /* Auto-update: see tools/release.py */\n'
         '(function () {{ try {{ fetch("{vf}?t=" + Date.now(), {{ cache: "no-store" }}).then(function (r) {{ return r.ok ? r.json() : null; }}).then(function (j) {{\n'
         '  if (!j || !j.build || j.build === window.BUILD) return;\n'
         '  var k = "obReloaded:" + j.build; try {{ if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); }} catch (e) {{}}\n'
         '  var u = new URL(location.href); u.searchParams.set("u", j.build); location.replace(u.toString());\n'
         '}}).catch(function () {{}}); }} catch (e) {{}} }})();</script>\n')
for rel in PAGES:
    p = ROOT / rel; s = p.read_text()
    vf = "version.json" if "/" not in rel else "../version.json"
    s = re.sub(r'<script>window\.BUILD = .*?</script>\n', '', s, flags=re.S)
    s = s.replace('<meta name="viewport"', CHECK.format(b=build, vf=vf) + '<meta name="viewport"', 1) if 'window.BUILD' not in s else s
    s = re.sub(r'(\.(?:js|css)\?v=)[^"\']+', r'\g<1>' + build, s)
    p.write_text(s)
(ROOT / "version.json").write_text(json.dumps({"build": build}) + "\n")
print("build", build)
