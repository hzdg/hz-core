on run argv
  set toPath to ""
  tell application "Finder"
    set toPath to (POSIX file (item 1 of argv)) as alias
    set theKind to kind of toPath
    if theKind is "Alias" then
      set toPath to (original item of toPath) as alias
    end if
  end tell
  return POSIX path of toPath
end run
