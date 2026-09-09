{pkgs}: {
  deps = [
    pkgs.postgresql_16
    pkgs.chromium
    pkgs.cairo
    pkgs.pango
    pkgs.nspr
    pkgs.nss
    pkgs.glib
    pkgs.lsof
    pkgs.zip
    pkgs.jq
  ];
}
