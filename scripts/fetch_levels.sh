#!/bin/sh
# 下载卫戍协议·规程 30 个场地的关卡文件。用法: sh fetch_levels.sh 输出目录
out="$1"; mkdir -p "$out"
B=https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/levels/activities/act3autochess
for m in 01 02 03 04 05 06 09 10 11 12; do
  for s in 1 2 3; do
    f="level_act3autochess_m${m}_sub_0${s}.json"
    [ -s "$out/$f" ] || curl -sfL "$B/level_act3autochess_m$m/$f" -o "$out/$f" || echo "失败: $f"
  done
done
ls "$out" | wc -l
