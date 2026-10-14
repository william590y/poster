#!/usr/bin/env python3
"""probe.py master.mp4 copy.mp4 ... : ffprobe (frames counted), audio md5 vs master, ebur128 of each copy"""
import subprocess, json, re, sys
def run(c): return subprocess.run(c, capture_output=True, text=True)
def md5(p, sel): return run(["ffmpeg","-v","error","-i",p,"-map",sel,"-c","copy","-f","md5","-"]).stdout.strip().replace("MD5=","")
def info(p):
    j=json.loads(run(["ffprobe","-v","error","-count_frames","-show_entries","stream=codec_type,codec_name,profile,codec_tag_string,width,height,pix_fmt,r_frame_rate,nb_read_frames,duration,start_time,bit_rate,sample_rate,color_space,color_range:format=duration,size","-of","json",p]).stdout)
    v=[s for s in j["streams"] if s["codec_type"]=="video"][0]; a=[s for s in j["streams"] if s["codec_type"]=="audio"][0]
    return v,a,j["format"]
def ebur(p):
    s=run(["ffmpeg","-hide_banner","-nostats","-i",p,"-map","0:a:0","-af","ebur128=peak=true","-f","null","-"]).stderr
    s=s[s.rfind("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS",s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS",s).group(1))
m=sys.argv[1]; am=md5(m,"0:a:0")
for p in sys.argv[2:]:
    v,a,f=info(p); I,tp=ebur(p)
    head=open(p,"rb").read(1<<16); fs=head.find(b"moov")>=0 and (head.find(b"mdat")<0 or head.find(b"moov")<head.find(b"mdat"))
    print(f'{p}\n  {v["codec_name"]} {v.get("profile")} tag {v["codec_tag_string"]} {v["width"]}x{v["height"]} {v["pix_fmt"]} {v["r_frame_rate"]} {v["nb_read_frames"]} frames, v dur {float(v["duration"]):.3f} start {v["start_time"]}, {v.get("color_space")}/{v.get("color_range")}; audio {a["codec_name"]} {a["sample_rate"]} dur {float(a["duration"]):.3f} start {a["start_time"]}; size {int(f["size"])/1e6:.2f} MB ({int(f["size"])} B); faststart {fs}\n  audio md5 == master: {md5(p,"0:a:0")==am}; {I} LUFS, {tp} dBTP')
