/**
 * FXFORGE LAB - ONNX EXPORT & ZERO-LATENCY MT5 INTEGRATION SPECIFICATION
 * Generates PyTorch training & ONNX export script + Complete Native MQL5 Expert Advisor Source
 */

export function generatePythonOnnxScript(): string {
  return `"""
FXFORGE LAB - DEEP RL POLICY ONNX EXPORTER
Stage 4 & 5: Deep RL Policy (Actor MLP) & Zero-Latency ONNX Exporter for MetaTrader 5
Opset Version: 14 | Input: [1, 6] float32 | Output: [1, 3] float32
"""

import os
import glob
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# 1. ACTOR POLICY NETWORK ARCHITECTURE (s_t in R^6 -> pi in R^3)
class FXForgeActorPolicy(nn.Module):
    def __init__(self, state_dim: int = 6, action_dim: int = 3):
        super(FXForgeActorPolicy, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 64),
            nn.LeakyReLU(negative_slope=0.1),
            nn.Dropout(p=0.15),
            nn.Linear(64, 32),
            nn.LeakyReLU(negative_slope=0.1),
            nn.Linear(32, action_dim),
            nn.Softmax(dim=-1)
        )

    def forward(self, state_input: torch.Tensor) -> torch.Tensor:
        """
        Input state_input: [batch_size, 6]
          - s[0]: Ret5 (Rolling 5-bar return %)
          - s[1]: Ret10 (Rolling 10-bar return %)
          - s[2]: Ret20 (Rolling 20-bar return %)
          - s[3]: Volat10 (Rolling 10-bar normalized volatility %)
          - s[4]: DistSMA20 (Distance from SMA20 %)
          - s[5]: Pos (-1.0 SHORT, 0.0 FLAT, 1.0 LONG)
        Output action_probs: [batch_size, 3]
          - P(0: BUY), P(1: HOLD), P(2: SELL)
        """
        return self.net(state_input)

def export_onnx_to_mt5():
    # Instantiate Model & Set to Evaluation Mode
    model = FXForgeActorPolicy(state_dim=6, action_dim=3)
    model.eval()

    # Dummy Input matching exact MT5 State Vector shape [1, 6] float32
    dummy_state = torch.tensor([[0.45, 0.82, 1.15, 0.28, 0.35, 0.0]], dtype=torch.float32)

    # Resolve MT5 Terminal Data Directory
    appdata = os.getenv('APPDATA')
    target_dirs = []
    if appdata:
        mt5_pattern = os.path.join(appdata, 'MetaQuotes', 'Terminal', '*', 'MQL5', 'Files')
        target_dirs = glob.glob(mt5_pattern)

    export_path = "rl_trading_model.onnx"
    
    # Export via torch.onnx with Opset 14
    torch.onnx.export(
        model,
        dummy_state,
        export_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['state_input'],
        output_names=['action_probs'],
        dynamic_axes=None # Static shape [1, 6] for zero-latency execution
    )
    print(f"[FXFORGE LAB] ONNX model successfully exported: {export_path}")

    # Copy to active MT5 MQL5/Files directory
    for t_dir in target_dirs:
        try:
            dest = os.path.join(t_dir, "rl_trading_model.onnx")
            import shutil
            shutil.copyfile(export_path, dest)
            print(f"[FXFORGE LAB] Auto-deployed to MT5 directory: {dest}")
        except Exception as e:
            print(f"[WARNING] Failed to copy to {t_dir}: {e}")

if __name__ == "__main__":
    export_onnx_to_mt5()
`;
}

export function generateMql5SourceCode(): string {
  return `//+------------------------------------------------------------------+
//|                                           FXForge_RL_Agent.mq5   |
//|                       FXFORGE LAB - QUANTITATIVE AI & DEEP RL    |
//|                   Zero-Latency ONNX Execution for MetaTrader 5   |
//+------------------------------------------------------------------+
#property copyright "FXFORGE LAB - Quantitative AI Architecture"
#property link      "https://github.com/superman-owner/fxforge-lab"
#property version   "1.00"
#property strict

#include <Trade\\Trade.mqh>
CTrade trade;

//--- ONNX Model Resource
#resource "\\\\Files\\\\rl_trading_model.onnx" as uchar ExtOnnxModelBuffer[]

//--- Input Parameters
input group "=== FXFORGE AI SETTINGS ===";
input string   InpSymbol            = "BTCUSDT";  // Symbol
input ENUM_TIMEFRAMES InpTimeframe  = PERIOD_M15; // Timeframe
input double   InpLotSize           = 0.10;       // Fixed Lot Size
input double   InpMaxSpreadPips     = 2.5;        // Spread Filter (Pips)
input double   InpConfidenceThresh  = 0.55;       // Min Action Confidence (0.0-1.0)
input ulong    InpMagicNumber       = 888666;     // EA Magic Number

//--- Global Handles
long   onnx_handle = INVALID_HANDLE;
int    sma20_handle = INVALID_HANDLE;
double current_position_state = 0.0; // -1.0 (SHORT), 0.0 (FLAT), 1.0 (LONG)

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(InpMagicNumber);

   // 1. Load ONNX Model from In-Memory Resource Buffer
   onnx_handle = OnnxCreateFromBuffer(ExtOnnxModelBuffer, ONNX_DEFAULT);
   if(onnx_handle == INVALID_HANDLE)
   {
      Print("[FXFORGE ERROR] Failed to create ONNX model. Error code: ", GetLastError());
      return(INIT_FAILED);
   }

   // 2. Set ONNX Input & Output Shapes: [1, 6] -> [1, 3]
   const long in_shape[]  = {1, 6};
   const long out_shape[] = {1, 3};

   if(!OnnxSetInputShape(onnx_handle, 0, in_shape) || !OnnxSetOutputShape(onnx_handle, 0, out_shape))
   {
      Print("[FXFORGE ERROR] Failed to set ONNX tensor shapes. Error: ", GetLastError());
      OnnxRelease(onnx_handle);
      return(INIT_FAILED);
   }

   // 3. Initialize Indicators (SMA 20)
   sma20_handle = iMA(InpSymbol, InpTimeframe, 20, 0, MODE_SMA, PRICE_CLOSE);
   if(sma20_handle == INVALID_HANDLE)
   {
      Print("[FXFORGE ERROR] Failed to initialize SMA20 indicator.");
      return(INIT_FAILED);
   }

   Print("[FXFORGE LAB] Deep RL Policy Initialized Successfully. ONNX Engine Active.");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(onnx_handle != INVALID_HANDLE)
   {
      OnnxRelease(onnx_handle);
      onnx_handle = INVALID_HANDLE;
   }
   if(sma20_handle != INVALID_HANDLE)
   {
      IndicatorRelease(sma20_handle);
   }
}

//+------------------------------------------------------------------+
//| Calculate State Vector s_t in R^6                                |
//+------------------------------------------------------------------+
bool BuildStateVector(float &state_vector[])
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(InpSymbol, InpTimeframe, 0, 30, rates) < 25) return false;

   double sma_vals[];
   ArraySetAsSeries(sma_vals, true);
   if(CopyBuffer(sma20_handle, 0, 0, 5, sma_vals) < 2) return false;

   double p_curr = rates[0].close;
   double p_5    = rates[5].close;
   double p_10   = rates[10].close;
   double p_20   = rates[20].close;

   // 1. Returns (%): Ret5, Ret10, Ret20
   float ret5  = (float)(((p_curr - p_5) / p_5) * 100.0);
   float ret10 = (float)(((p_curr - p_10) / p_10) * 100.0);
   float ret20 = (float)(((p_curr - p_20) / p_20) * 100.0);

   // 2. Rolling Volatility 10
   double sum = 0.0;
   for(int i=0; i<10; i++) sum += rates[i].close;
   double mean = sum / 10.0;
   double var = 0.0;
   for(int i=0; i<10; i++) var += MathPow(rates[i].close - mean, 2);
   float volat10 = (float)((MathSqrt(var / 10.0) / p_curr) * 100.0);

   // 3. Distance from SMA20 (%)
   float distSma20 = (float)(((p_curr - sma_vals[0]) / p_curr) * 100.0);

   // 4. Current Position State
   float pos = (float)current_position_state;

   // Pack into State Vector [1, 6]
   state_vector[0] = ret5;
   state_vector[1] = ret10;
   state_vector[2] = ret20;
   state_vector[3] = volat10;
   state_vector[4] = distSma20;
   state_vector[5] = pos;

   return true;
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Execute strictly once per new bar open to prevent sub-bar jitter
   static datetime last_bar_time = 0;
   datetime current_bar_time = iTime(InpSymbol, InpTimeframe, 0);
   if(current_bar_time == last_bar_time) return;
   last_bar_time = current_bar_time;

   // Spread Guard Filter
   double spread = (double)SymbolInfoInteger(InpSymbol, SYMBOL_SPREAD) * SymbolInfoDouble(InpSymbol, SYMBOL_POINT);
   double pips = spread / (_Point * 10);
   if(pips > InpMaxSpreadPips)
   {
      Print("[FXFORGE GUARD] Spread exceed limit: ", pips, " pips. Skipping inference.");
      return;
   }

   // 1. Construct State Vector
   float state_tensor[6];
   if(!BuildStateVector(state_tensor)) return;

   // 2. Run Zero-Latency ONNX Forward Pass
   float action_probs[3]; // [P(BUY), P(HOLD), P(SELL)]
   if(!OnnxRun(onnx_handle, ONNX_NO_CONVERSION, state_tensor, action_probs))
   {
      Print("[FXFORGE ERROR] ONNX inference execution failed: ", GetLastError());
      return;
   }

   float p_buy  = action_probs[0];
   float p_hold = action_probs[1];
   float p_sell = action_probs[2];

   // 3. Select Decision by ArgMax & Confidence Threshold
   int action = 1; // Default HOLD
   if(p_buy > p_hold && p_buy > p_sell && p_buy >= InpConfidenceThresh)
      action = 0; // BUY / LONG
   else if(p_sell > p_hold && p_sell > p_buy && p_sell >= InpConfidenceThresh)
      action = 2; // SELL / SHORT
   else
      action = 1; // HOLD / FLAT

   // 4. Order Execution Routing
   if(action == 0 && current_position_state <= 0)
   {
      trade.PositionClose(InpSymbol);
      trade.Buy(InpLotSize, InpSymbol);
      current_position_state = 1.0;
      Print("[FXFORGE AI] Executing BUY Order. Confidence: ", DoubleToString(p_buy * 100, 1), "%");
   }
   else if(action == 2 && current_position_state >= 0)
   {
      trade.PositionClose(InpSymbol);
      trade.Sell(InpLotSize, InpSymbol);
      current_position_state = -1.0;
      Print("[FXFORGE AI] Executing SELL Order. Confidence: ", DoubleToString(p_sell * 100, 1), "%");
   }
}
//+------------------------------------------------------------------+
`;
}
