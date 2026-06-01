Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("c:\Users\Admin_IT\Documents\SiTa\PRD_SITA_Lengkap.docx")
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlString = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = [System.Text.RegularExpressions.Regex]::Replace($xmlString, "<[^>]+>", "`n")
$text = [System.Text.RegularExpressions.Regex]::Replace($text, "\n\s*\n", "`n")
$text | Out-File -FilePath "c:\Users\Admin_IT\Documents\SiTa\PRD_SITA_Lengkap.txt" -Encoding utf8
