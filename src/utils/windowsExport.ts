import JSZip from 'jszip';

// 1. C# Source Code for native Windows EXE compiler
export function getCSharpExeSourceCode(targetUrl: string): string {
  return `using System;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.IO;

namespace CardsAndGiftsPOS
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string targetUrl = "${targetUrl}";
            string localHtml = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "CardsAndGiftsPOS-Offline.html");

            // If offline html file exists, prefer local offline file
            if (File.Exists(localHtml))
            {
                targetUrl = "file:///" + localHtml.Replace("\\\\", "/");
            }

            // Launch in dedicated Microsoft Edge or Chrome app window
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "msedge.exe";
            psi.Arguments = "--app=\\"" + targetUrl + "\\" --window-size=1280,840";
            psi.UseShellExecute = true;

            try
            {
                Process.Start(psi);
            }
            catch
            {
                try
                {
                    psi.FileName = "chrome.exe";
                    Process.Start(psi);
                }
                catch
                {
                    Process.Start(targetUrl);
                }
            }
        }
    }
}
`;
}

// 2. Windows Batch script that compiles CardsAndGiftsPOS.exe using built-in csc.exe compiler
export function getCompileExeBatchScript(targetUrl: string): string {
  return `@echo off
title Building Cards & Gifts POS .EXE
cls
echo ========================================================
echo   BUILDING CARDS ^& GIFTS POS WINDOWS EXECUTABLE (.EXE)
echo ========================================================
echo.
echo Searching for Windows built-in .NET C# compiler (csc.exe)...

set CSC_PATH=""
if exist "%WINDIR%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set CSC_PATH="%WINDIR%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%WINDIR%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set CSC_PATH="%WINDIR%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if %CSC_PATH%=="" (
    echo [ERROR] .NET Framework compiler not found in standard Windows path.
    echo Launching POS via direct standalone batch runner instead...
    start "" msedge --app="${targetUrl}" --window-size=1280,840
    pause
    exit /b 1
)

echo Found Windows Compiler at: %CSC_PATH%
echo Compiling CardsAndGiftsPOS.exe...

:: Create temporary C# source file
(
echo using System;
echo using System.Diagnostics;
echo using System.Windows.Forms;
echo using System.IO;
echo namespace CardsAndGiftsPOS {
echo   static class Program {
echo     [STAThread]
echo     static void Main() {
echo       string url = "${targetUrl}";
echo       string localHtml = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "CardsAndGiftsPOS-Offline.html");
echo       if (File.Exists(localHtml)) { url = "file:///" + localHtml.Replace("\\\\", "/"); }
echo       ProcessStartInfo psi = new ProcessStartInfo();
echo       psi.FileName = "msedge.exe";
echo       psi.Arguments = "--app=\\"" + url + "\\" --window-size=1280,840";
echo       psi.UseShellExecute = true;
echo       try { Process.Start(psi); }
echo       catch {
echo         try { psi.FileName = "chrome.exe"; Process.Start(psi); }
echo         catch { Process.Start(url); }
echo       }
echo     }
echo   }
echo }
) > "%TEMP%\\pos_temp.cs"

%CSC_PATH% /target:winexe /out:"%~dp0CardsAndGiftsPOS.exe" "%TEMP%\\pos_temp.cs" /reference:System.Windows.Forms.dll >nul 2>&1
del "%TEMP%\\pos_temp.cs" >nul 2>&1

if exist "%~dp0CardsAndGiftsPOS.exe" (
    echo.
    echo ========================================================
    echo   SUCCESS! CardsAndGiftsPOS.exe WAS CREATED!
    echo ========================================================
    echo Location: %~dp0CardsAndGiftsPOS.exe
    echo.
    echo Starting CardsAndGiftsPOS.exe now...
    start "" "%~dp0CardsAndGiftsPOS.exe"
) else (
    echo [Notice] Falling back to direct app runner...
    start "" msedge --app="${targetUrl}" --window-size=1280,840
)

exit
`;
}

// 3. Native Windows .HTA application (Direct executable format recognized by Windows mshta.exe)
export function getWindowsHtaContent(appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<title>Cards & Gifts Retail POS</title>
<hta:application 
  id="CardsGiftsPOS"
  applicationname="Cards & Gifts Retail POS"
  border="thin"
  borderstyle="normal"
  caption="yes"
  maximizebutton="yes"
  minimizebutton="yes"
  sysmenu="yes"
  windowstate="maximize"
  navigable="yes"
  scroll="no"
  singleinstance="yes"
  icon="shell32.dll,220"
/>
<meta http-equiv="x-ua-compatible" content="ie=edge">
<style>
  html, body, iframe {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: none;
    overflow: hidden;
    background-color: #020617;
  }
</style>
</head>
<body>
<iframe src="${appUrl}" allow="fullscreen; camera"></iframe>
</body>
</html>
`;
}

// 4. Windows Batch Launcher
export function getWindowsBatchScript(appUrl: string = window.location.href): string {
  return `@echo off
title Cards and Gifts Retail POS
cls
echo =======================================================
echo     CARDS ^& GIFTS RETAIL POS - OFFLINE DESKTOP RUNNER
echo =======================================================
echo Starting Retail POS Terminal in standalone kiosk window...
echo.

set TARGET_URL=${appUrl}
if exist "%~dp0CardsAndGiftsPOS-Offline.html" (
    set TARGET_URL=file:///%~dp0CardsAndGiftsPOS-Offline.html
)

:: Try Edge App Mode (Clean borderless Windows application)
where msedge >nul 2>&1
if %errorlevel% equ 0 (
    start "" msedge --app="%TARGET_URL%" --window-size=1280,840
    exit
)

:: Fallback Chrome App Mode
where chrome >nul 2>&1
if %errorlevel% equ 0 (
    start "" chrome --app="%TARGET_URL%" --window-size=1280,840
    exit
)

start "" "%TARGET_URL%"
exit
`;
}

// 5. 100% Offline Standalone POS Single-File HTML
export function getStandaloneOfflineHtml(storeName: string, taxRate: number, currency: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${storeName} - Standalone Offline POS</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: #020617; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
  header { background: #0f172a; border-bottom: 1px solid #1e293b; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
  .logo { font-size: 16px; font-weight: 800; color: #f59e0b; }
  .badge { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-left: 8px; }
  .container { display: flex; flex: 1; padding: 16px; gap: 16px; overflow: hidden; }
  .left-col { flex: 1; display: flex; flex-direction: column; gap: 12px; }
  .right-col { width: 440px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .keypad-display { background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; text-align: right; }
  .keypad-price { font-family: monospace; font-size: 32px; font-weight: 900; color: #10b981; }
  .keypad-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .btn { background: #1e293b; border: 1px solid #334155; color: #f8fafc; font-size: 16px; font-weight: bold; padding: 14px; border-radius: 8px; cursor: pointer; user-select: none; }
  .btn:active { transform: scale(0.96); }
  .btn-50 { background: #e11d48; color: white; grid-row: span 2; border-color: #f43f5e; font-size: 13px; font-weight: 900; }
  .btn-add { background: #f59e0b; color: #020617; font-weight: 900; grid-column: span 4; padding: 14px; font-size: 15px; }
  .cart-list { flex: 1; overflow-y: auto; background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 10px; }
  .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
  .totals { border-top: 1px solid #1e293b; padding-top: 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
  .total-due { font-size: 24px; font-weight: 900; color: #10b981; display: flex; justify-content: space-between; align-items: baseline; margin-top: 6px; font-family: monospace; }
  .btn-checkout { background: #059669; color: white; font-weight: 900; font-size: 16px; padding: 14px; border-radius: 8px; border: none; cursor: pointer; margin-top: 8px; }
  .lock-screen { position: fixed; inset: 0; background: #020617; z-index: 9999; display: flex; align-items: center; justify-content: center; }
  .lock-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 30px; text-align: center; width: 340px; }
</style>
</head>
<body>

<!-- PIN LOCK SCREEN -->
<div id="lockScreen" class="lock-screen">
  <div class="lock-card">
    <div style="font-size:36px; margin-bottom:8px;">🔒</div>
    <div class="logo">${storeName}</div>
    <p style="font-size:12px; color:#94a3b8; margin:6px 0 16px 0;">Enter 4-Digit Staff PIN (Default: 1234)</p>
    <div id="pinDots" style="font-size:28px; letter-spacing:10px; color:#f59e0b; margin-bottom:16px;">○ ○ ○ ○</div>
    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
      <button class="btn" onclick="addPin('1')">1</button>
      <button class="btn" onclick="addPin('2')">2</button>
      <button class="btn" onclick="addPin('3')">3</button>
      <button class="btn" onclick="addPin('4')">4</button>
      <button class="btn" onclick="addPin('5')">5</button>
      <button class="btn" onclick="addPin('6')">6</button>
      <button class="btn" onclick="addPin('7')">7</button>
      <button class="btn" onclick="addPin('8')">8</button>
      <button class="btn" onclick="addPin('9')">9</button>
      <button class="btn" onclick="clearPin()" style="font-size:12px; color:#f43f5e;">CLR</button>
      <button class="btn" onclick="addPin('0')">0</button>
      <button class="btn" onclick="backPin()">⌫</button>
    </div>
  </div>
</div>

<header>
  <div style="display:flex; align-items:center;">
    <span class="logo">${storeName}</span>
    <span class="badge">100% OFFLINE EDITION</span>
  </div>
  <button onclick="lockApp()" class="btn" style="padding:6px 12px; font-size:12px;">🔒 Lock</button>
</header>

<div class="container">
  <div class="left-col">
    <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:16px; flex:1; display:flex; flex-direction:column;">
      <h3 style="font-size:14px; margin-bottom:10px; color:#94a3b8;">Active Checkout Basket</h3>
      <div id="cartList" class="cart-list"></div>
      <div class="totals">
        <div style="display:flex; justify-content:space-between; color:#94a3b8;">
          <span>Subtotal:</span><span id="subtotal">${currency}0.00</span>
        </div>
        <div style="display:flex; justify-content:space-between; color:#e11d48;" id="discRow">
          <span>50% Promo Savings:</span><span id="discounts">-${currency}0.00</span>
        </div>
        <div style="display:flex; justify-content:space-between; color:#94a3b8;">
          <span>Sales Tax (${taxRate}%):</span><span id="tax">${currency}0.00</span>
        </div>
        <div class="total-due">
          <span>TOTAL:</span><span id="grandTotal">${currency}0.00</span>
        </div>
        <button class="btn-checkout" onclick="checkout()">Tender Payment & Print Receipt</button>
      </div>
    </div>
  </div>

  <div class="right-col">
    <div style="display:flex; justify-content:space-between; font-size:12px; color:#94a3b8; font-weight:bold;">
      <span>RAPID PRICE KEYPAD</span><span>STARTS AT $0.00</span>
    </div>
    <div class="keypad-display">
      <div id="promoBadge" style="display:none; font-size:11px; color:#f43f5e; font-weight:bold; margin-bottom:4px;">★ 50% OFF PROMO APPLIED ★</div>
      <div id="keypadPrice" class="keypad-price">${currency}0.00</div>
    </div>
    <div class="keypad-grid">
      <button class="btn" onclick="digit(7)">7</button>
      <button class="btn" onclick="digit(8)">8</button>
      <button class="btn" onclick="digit(9)">9</button>
      <button class="btn" onclick="clearPrice()" style="color:#f43f5e; font-size:12px;">CLEAR</button>
      
      <button class="btn" onclick="digit(4)">4</button>
      <button class="btn" onclick="digit(5)">5</button>
      <button class="btn" onclick="digit(6)">6</button>
      <button class="btn" onclick="backPrice()">⌫</button>

      <button class="btn" onclick="digit(1)">1</button>
      <button class="btn" onclick="digit(2)">2</button>
      <button class="btn" onclick="digit(3)">3</button>
      <button class="btn btn-50" onclick="toggle50()">50%<br>OFF</button>

      <button class="btn" onclick="digit(0)">0</button>
      <button class="btn" onclick="digit('00')">00</button>
      <button class="btn" onclick="addDollar(5)" style="color:#10b981; font-size:13px;">+$5</button>
      
      <button class="btn btn-add" onclick="addToCart()">Add ${currency} to Basket</button>
    </div>
  </div>
</div>

<script>
let currentPin = '';
let priceCents = 0;
let isHalfOff = false;
let cart = [];
const TAX_RATE = ${taxRate};
const CURRENCY = '${currency}';

function updatePinDisplay() {
  let dots = '';
  for(let i=0; i<4; i++) { dots += (i < currentPin.length ? '● ' : '○ '); }
  document.getElementById('pinDots').innerText = dots.trim();
}
function addPin(d) {
  if (currentPin.length >= 4) return;
  currentPin += d;
  updatePinDisplay();
  if (currentPin.length === 4) {
    if (currentPin === '1234') {
      document.getElementById('lockScreen').style.display = 'none';
      currentPin = '';
    } else {
      alert('Incorrect PIN! Default is 1234');
      currentPin = '';
      updatePinDisplay();
    }
  }
}
function clearPin() { currentPin = ''; updatePinDisplay(); }
function backPin() { currentPin = currentPin.slice(0, -1); updatePinDisplay(); }
function lockApp() { document.getElementById('lockScreen').style.display = 'flex'; updatePinDisplay(); }

function updatePriceDisplay() {
  let p = priceCents / 100;
  let eff = isHalfOff ? (p * 0.5) : p;
  document.getElementById('keypadPrice').innerText = CURRENCY + eff.toFixed(2);
  document.getElementById('promoBadge').style.display = isHalfOff ? 'block' : 'none';
}
function digit(d) {
  if (d === '00') { if (priceCents > 0) priceCents *= 100; }
  else { priceCents = priceCents * 10 + parseInt(d); }
  updatePriceDisplay();
}
function clearPrice() { priceCents = 0; isHalfOff = false; updatePriceDisplay(); }
function backPrice() { priceCents = Math.floor(priceCents / 10); updatePriceDisplay(); }
function addDollar(d) { priceCents += d * 100; updatePriceDisplay(); }
function toggle50() { if (priceCents > 0) { isHalfOff = !isHalfOff; updatePriceDisplay(); } }

function addToCart() {
  let p = priceCents / 100;
  let eff = isHalfOff ? (p * 0.5) : p;
  if (eff <= 0) return;
  cart.push({ name: isHalfOff ? 'Cards / Gift Item (50% Off)' : 'Cards / Gift Item', price: eff, orig: p, is50: isHalfOff });
  clearPrice();
  renderCart();
}

function renderCart() {
  let list = document.getElementById('cartList');
  list.innerHTML = '';
  let sub = 0, disc = 0;
  cart.forEach((item, idx) => {
    sub += item.orig;
    if (item.is50) disc += (item.orig - item.price);
    list.innerHTML += '<div class="cart-item"><span>' + item.name + '</span><span style="font-weight:bold;">' + CURRENCY + item.price.toFixed(2) + ' <button onclick="removeItem(' + idx + ')" style="background:none; border:none; color:#f43f5e; cursor:pointer;">✕</button></span></div>';
  });
  let net = sub - disc;
  let tax = (net * TAX_RATE) / 100;
  let total = net + tax;
  document.getElementById('subtotal').innerText = CURRENCY + sub.toFixed(2);
  document.getElementById('discounts').innerText = '-' + CURRENCY + disc.toFixed(2);
  document.getElementById('tax').innerText = CURRENCY + tax.toFixed(2);
  document.getElementById('grandTotal').innerText = CURRENCY + total.toFixed(2);
}
function removeItem(idx) { cart.splice(idx, 1); renderCart(); }
function checkout() {
  if (cart.length === 0) return;
  alert('Sale Completed! Printing receipt...');
  window.print();
  cart = [];
  renderCart();
}
</script>
</body>
</html>
`;
}

// Download file trigger helper
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain') {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  } catch {
    const encodedUri = encodeURI(`data:${mimeType};charset=utf-8,` + content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 1000);
  }
}

// Generate ZIP package with offline files and direct compiler
export async function generateWindowsZip(currentAppUrl: string = window.location.href): Promise<void> {
  const zip = new JSZip();

  const batchScript = getWindowsBatchScript(currentAppUrl);
  const compileExeScript = getCompileExeBatchScript(currentAppUrl);
  const htaApp = getWindowsHtaContent(currentAppUrl);
  const offlineHtml = getStandaloneOfflineHtml('Cards & Gifts Retail Store', 7.5, '$');

  const readme = `========================================================================
CARDS & GIFTS RETAIL POS - 100% OFFLINE WINDOWS DESKTOP PACKAGE
========================================================================

HOW TO RUN COMPLETELY OFFLINE ON WINDOWS:

METHOD 1: CREATE DIRECT .EXE FILE
- Double-click "Build-CardsAndGiftsPOS-EXE.bat"
- It will automatically use Windows's built-in compiler to create "CardsAndGiftsPOS.exe"
- Once created, you can double-click "CardsAndGiftsPOS.exe" anytime offline!

METHOD 2: NATIVE WINDOWS HTA EXECUTABLE
- Double-click "CardsAndGiftsPOS.hta"
- Windows runs this directly as a standalone desktop application with mshta.exe!

METHOD 3: OFFLINE DESKTOP BATCH RUNNER
- Double-click "CardsAndGiftsPOS.bat"
- Opens directly in Microsoft Edge or Google Chrome standalone kiosk mode!

METHOD 4: SINGLE-FILE STANDALONE OFFLINE HTML
- Double-click "CardsAndGiftsPOS-Offline.html"
- Contains all POS checkout features, $0.00 keypad, 50% Off buttons, 
  and 4-digit PIN lock screen that works with ZERO internet required!

DEFAULT 4-DIGIT PIN: 1234
`;

  zip.file('Build-CardsAndGiftsPOS-EXE.bat', compileExeScript);
  zip.file('CardsAndGiftsPOS.hta', htaApp);
  zip.file('CardsAndGiftsPOS.bat', batchScript);
  zip.file('CardsAndGiftsPOS-Offline.html', offlineHtml);
  zip.file('README-Offline-Windows.txt', readme);

  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Cards-and-Gifts-POS-Windows-Offline.zip';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 3000);
  } catch (err) {
    const base64 = await zip.generateAsync({ type: 'base64' });
    const dataUri = `data:application/zip;base64,${base64}`;
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = 'Cards-and-Gifts-POS-Windows-Offline.zip';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 2000);
  }
}
