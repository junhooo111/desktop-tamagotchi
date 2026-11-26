"""macOS 용 배포 zip 을 Windows 에서도 만든다(electron-builder 는 macOS 에서만 mac 빌드를 지원한다).

공식 Electron macOS zip 을 그대로 읽어서(심볼릭 링크 항목도 그대로 보존) Electron.app 을 'Desktop Tamagotchi.app' 으로
이름을 바꾸고, 우리 앱 파일(Contents/Resources/app)과 크롬 확장(Contents/Resources/extension)을 넣어 새 zip 으로 쓴다.
Windows 파일 시스템에는 심볼릭 링크를 만들 수 없어서 압축을 풀지 않고 zip 항목을 직접 옮긴다.

사용: python mac-zip.py <electron-darwin.zip> <앱 폴더> <확장 폴더> <출력.zip> <버전>
주의: 코드 서명·공증이 없는 파일이다(맥에서 처음 열 때 허용이 필요하다). 이 스크립트로는 동작을 확인하지 못한다.
"""
import os
import plistlib
import stat
import sys
import zipfile

src, appdir, extdir, out, version = sys.argv[1:6]
APP = 'Desktop Tamagotchi.app'
OLD = 'Electron.app'
BUNDLE_ID = 'com.desktop-tamagotchi.app'
EXE = 'Desktop Tamagotchi'

zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)

for info in zin.infolist():
    name = info.filename
    if not name.startswith(OLD):
        continue  # 라이선스 파일 같은 바깥 파일은 넣지 않는다
    if name.endswith('Contents/Resources/default_app.asar'):
        continue  # 기본 앱은 우리 앱으로 대체한다
    new_name = APP + name[len(OLD):]
    # Electron 은 실행 파일 이름이 'electron' 이면 개발 실행(app.isPackaged=false)으로 본다. 그래서 실행 파일과 헬퍼 앱의 이름을 앱 이름으로 바꾼다.
    # (Chromium 은 헬퍼를 '<실행 파일 이름> Helper' 로 찾으므로 헬퍼도 같이 바꿔야 한다. Electron Framework 는 그대로 둔다.)
    new_name = new_name.replace('Contents/MacOS/Electron', f'Contents/MacOS/{EXE}').replace('Electron Helper', f'{EXE} Helper')
    data = zin.read(info)
    if name == OLD + '/Contents/Info.plist':
        plist = plistlib.loads(data)
        plist['CFBundleName'] = 'Desktop Tamagotchi'
        plist['CFBundleDisplayName'] = 'Desktop Tamagotchi'
        plist['CFBundleExecutable'] = EXE
        plist['CFBundleIdentifier'] = BUNDLE_ID
        plist['CFBundleShortVersionString'] = version
        plist['CFBundleVersion'] = version
        data = plistlib.dumps(plist)
    elif name.endswith('.app/Contents/Info.plist') and 'Electron Helper' in name:
        # 헬퍼 앱의 이름·실행 파일 이름도 새 이름에 맞춘다
        plist = plistlib.loads(data)
        for key in ('CFBundleExecutable', 'CFBundleName', 'CFBundleDisplayName'):
            if isinstance(plist.get(key), str):
                plist[key] = plist[key].replace('Electron Helper', f'{EXE} Helper')
        # 헬퍼의 실행 파일 이름(앱 폴더 이름과 같다)을 분명히 적어 둔다
        plist['CFBundleExecutable'] = new_name.split('/')[-3][: -len('.app')]
        data = plistlib.dumps(plist)
    ni = zipfile.ZipInfo(new_name, info.date_time)
    ni.external_attr = info.external_attr  # 실행 권한·심볼릭 링크 표시를 그대로 둔다
    ni.create_system = 3  # Unix
    ni.compress_type = zipfile.ZIP_DEFLATED
    zout.writestr(ni, data)


def add_tree(root: str, prefix: str) -> int:
    count = 0
    for base, _dirs, files in os.walk(root):
        for f in files:
            full = os.path.join(base, f)
            rel = os.path.relpath(full, root).replace(os.sep, '/')
            ni = zipfile.ZipInfo(f'{prefix}/{rel}')
            ni.external_attr = (stat.S_IFREG | 0o644) << 16
            ni.create_system = 3
            ni.compress_type = zipfile.ZIP_DEFLATED
            with open(full, 'rb') as fh:
                zout.writestr(ni, fh.read())
            count += 1
    return count


n_app = add_tree(appdir, f'{APP}/Contents/Resources/app')
n_ext = add_tree(extdir, f'{APP}/Contents/Resources/extension')
zout.close()
print(f'{out}: 앱 파일 {n_app}개, 확장 파일 {n_ext}개')
