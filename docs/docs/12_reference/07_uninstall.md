```batch
# CMD to install Matrx
# msi install
msiexec.exe /i "matrx-win-1.0.25.msi" /qn

# exe install

start C:\Downloads\software_setup.exe /S

# Silent install Matrx EXE with custom host and port

start matrxo-win-101.11.3-x64-alpha-2023-8-24-12-54-14.exe /S /host=188.116.30.70 /port=8081
./matrxo-win-101.11.3.exe /S --host=matrxmeet.adaa.gov.ae --port=8011

# CMD to uninstall Matrx

# uninstall Msi

# Query the locally installed Matrx version and its GUID

wmic product where "name like '%%Matrx%%'" get Name, IdentifyingNumber, Version

# Use GUID to silently uninstall the specified version

# Example：msiexec /x {9EB258CF-64AC-4CA8-B759-AD035A311E22} /quiet /norestart

msiexec /x {App GUID} /quiet /norestart

msiexec.exe /x "matrx-win-1.0.25.msi" /qn

# uninstall EXE

# Silent uninstall

start "" "C:\Users\%USERNAME%\AppData\Local\Matrx\Uninstall Matrx.exe" /S

# Interactive uninstall

"C:\Users\%USERNAME%\AppData\Local\Matrx\Uninstall Matrx.exe"
```
