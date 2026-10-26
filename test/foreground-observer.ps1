param([int]$TargetPid,[string]$StopFile)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
public static class FocusObserver {
 delegate void Callback(IntPtr hook,uint evt,IntPtr hwnd,int obj,int child,uint thread,uint time);
 [DllImport("user32.dll")] static extern IntPtr SetWinEventHook(uint min,uint max,IntPtr mod,Callback cb,uint pid,uint tid,uint flags);
 [DllImport("user32.dll")] static extern bool UnhookWinEvent(IntPtr hook);
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd,out uint pid);
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr hwnd,System.Text.StringBuilder text,int count);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr hwnd,System.Text.StringBuilder text,int count);
 static Callback callback; static bool activated; static int events;
 static void Observe(IntPtr hwnd,int target) { uint pid;GetWindowThreadProcessId(hwnd,out pid);events++;if(pid==target){activated=true;var name=new System.Text.StringBuilder(256);var title=new System.Text.StringBuilder(256);GetClassName(hwnd,name,256);GetWindowText(hwnd,title,256);Console.Error.WriteLine("TARGET_FOREGROUND hwnd="+hwnd+" class="+name+" title="+title);} }
 public static void Run(int target,string stop) {
  callback=(h,e,w,o,c,t,ms)=>Observe(GetForegroundWindow(),target);
  IntPtr hook=SetWinEventHook(3,3,IntPtr.Zero,callback,0,0,0);
  if(hook==IntPtr.Zero)throw new Exception("Foreground event hook unavailable");
  try { Observe(GetForegroundWindow(),target);Console.WriteLine("READY");Console.Out.Flush();
   using(var timer=new Timer()){timer.Interval=20;timer.Tick+=(s,e)=>{if(File.Exists(stop))Application.ExitThread();};timer.Start();Application.Run();}
   Observe(GetForegroundWindow(),target);Console.WriteLine("{\"activated\":"+(activated?"true":"false")+",\"events\":"+events+"}");
  } finally { UnhookWinEvent(hook); }
 }
}
'@ -ReferencedAssemblies System.Windows.Forms
[FocusObserver]::Run($TargetPid,$StopFile)
