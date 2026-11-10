#!/bin/sh
# 用法: sh fetch_images.sh images.tsv 输出目录
# images.tsv 由 image_list.py 生成；已存在的文件会跳过
out="$2"; : > "$out/missing.txt"
tr -d '\r' < "$1" | while IFS="$(printf '\t')" read -r path url; do
  mkdir -p "$out/$(dirname "$path")"
  [ -s "$out/$path" ] && continue
  code=$(curl -s -o "$out/$path" -w "%{http_code}" "$url")
  if [ "$code" != "200" ]; then rm -f "$out/$path"; echo "$path $code" >> "$out/missing.txt"; fi
done
echo "avatars: $(ls "$out/avatars" | wc -l)  icons: $(ls "$out/icons" | wc -l)"
echo "missing:"; cat "$out/missing.txt"
