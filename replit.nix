{pkgs}: {
  deps = [
    pkgs.chromium
    pkgs.cairo
    pkgs.pango
    pkgs.nspr
    pkgs.nss
    pkgs.glib
    pkgs.lsof
    pkgs.zip
    pkgs.jq
    pkgs.postgresql
  ];
}
