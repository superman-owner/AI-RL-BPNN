"""
===================================================================================
FXFORGE LAB - DYNAMIC MODULAR DEEP RL TRAINING ENGINE (PyTorch)
===================================================================================
Institutional Multi-Objective Actor-Critic Reinforcement Learning Engine
Driven dynamically by the Visual Node Graph Pipeline & Node Configurations.
Supports: Dynamic Layer Dimensions, Activations, Initializations, Multi-Lookbacks,
          Real MT5 Data Ingestion, Monte Carlo Stress Tests, and 1-Click ONNX Export.
===================================================================================
"""

import os
import sys
import json
import glob
import time
import shutil
import math
import argparse
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Categorical

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

# Force UTF-8 for Windows console support
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

torch.manual_seed(42)
np.random.seed(42)

# =========================================================================
# 1. DYNAMIC ACTIVATION & INITIALIZATION RESOLVERS
# =========================================================================
def get_activation_layer(act_name: str):
    name = str(act_name).lower()
    if 'leaky' in name:
        return nn.LeakyReLU(negative_slope=0.1)
    elif 'gelu' in name:
        return nn.GELU()
    elif 'mish' in name:
        return nn.Mish()
    elif 'elu' in name:
        return nn.ELU(alpha=1.0)
    elif 'tanh' in name:
        return nn.Tanh()
    else:
        return nn.ReLU()

def initialize_linear_weights(layer: nn.Linear, init_type: str = "kaiming_normal", act_name: str = "leaky_relu"):
    name = str(init_type).lower()
    if 'kaiming_uniform' in name or 'he_uniform' in name:
        nn.init.kaiming_uniform_(layer.weight, a=0.1, nonlinearity='leaky_relu')
    elif 'xavier_uniform' in name or 'glorot_uniform' in name:
        nn.init.xavier_uniform_(layer.weight)
    elif 'xavier_normal' in name or 'glorot_normal' in name:
        nn.init.xavier_normal_(layer.weight)
    elif 'orthogonal' in name:
        nn.init.orthogonal_(layer.weight, gain=1.414)
    else:
        # Default: Kaiming Normal (He)
        nn.init.kaiming_normal_(layer.weight, a=0.1, nonlinearity='leaky_relu')
        
    if layer.bias is not None:
        nn.init.constant_(layer.bias, 0.01)

# =========================================================================
# 2. DYNAMIC DEEP RL ACTOR-CRITIC NETWORK
# =========================================================================
class DynamicFXForgeActorCritic(nn.Module):
    def __init__(self, config: dict):
        super(DynamicFXForgeActorCritic, self).__init__()
        self.config = config
        
        self.state_dim = int(config.get('input_dim', 6))
        self.action_dim = int(config.get('action_dim', 3))
        
        # 1. Feature Expansion (FC1)
        self.fc1_units = int(config.get('hidden1_units', 64))
        self.fc1 = nn.Linear(self.state_dim, self.fc1_units)
        self.act1 = get_activation_layer(config.get('hidden1_activation', 'LeakyReLU'))
        
        # Anti-Overfitting: Dropout & LayerNorm
        self.has_dropout = bool(config.get('has_dropout', True))
        self.dropout_rate = float(config.get('dropout_rate', 0.15))
        self.dropout = nn.Dropout(p=self.dropout_rate) if self.has_dropout else nn.Identity()
        
        self.has_layer_norm = bool(config.get('has_layer_norm', True))
        self.layer_norm = nn.LayerNorm(self.fc1_units) if self.has_layer_norm else nn.Identity()
        
        # 2. Strategy Bottleneck Synthesizer (FC2)
        self.fc2_units = int(config.get('hidden2_units', 32))
        self.fc2 = nn.Linear(self.fc1_units, self.fc2_units)
        self.act2 = get_activation_layer(config.get('hidden2_activation', 'LeakyReLU'))
        self.has_residual = bool(config.get('has_residual', True))
        
        # 3. Policy Action Head (FC3: Actor) & Value Head (Critic)
        self.actor_head = nn.Linear(self.fc2_units, self.action_dim)
        self.softmax = nn.Softmax(dim=-1)
        self.critic_head = nn.Linear(self.fc2_units, 1)
        
        # Apply Selected Weight Initialization
        init_type = config.get('weight_init', 'Kaiming Normal')
        for layer in [self.fc1, self.fc2, self.actor_head, self.critic_head]:
            initialize_linear_weights(layer, init_type)

    def forward(self, state: torch.Tensor):
        x1 = self.act1(self.fc1(state))
        x1 = self.dropout(x1)
        x1 = self.layer_norm(x1)
        
        x2 = self.act2(self.fc2(x1))
        
        # Dynamic Residual Connection
        if self.has_residual:
            min_dim = min(self.fc1_units, self.fc2_units)
            x2 = x2 + x1[:, :min_dim] * 0.25
            
        action_logits = self.actor_head(x2)
        action_probs = self.softmax(action_logits)
        state_value = self.critic_head(x2)
        
        return action_probs, state_value, x1, x2

# =========================================================================
# 3. REAL MARKET DATA INGESTION & FEATURE EXTRACTOR
# =========================================================================
class MarketDataLoader:
    @staticmethod
    def load_or_generate_data(symbol: str = "XAUUSD", timeframe: str = "M15", bars: int = 10000) -> pd.DataFrame:
        """Attempts to pull real MT5 rates; fallbacks to stochastic institutional series"""
        df = None
        if MT5_AVAILABLE and mt5.initialize():
            try:
                tf_map = {
                    "M1": mt5.TIMEFRAME_M1, "M5": mt5.TIMEFRAME_M5, "M15": mt5.TIMEFRAME_M15,
                    "M30": mt5.TIMEFRAME_M30, "H1": mt5.TIMEFRAME_H1, "H4": mt5.TIMEFRAME_H4, "D1": mt5.TIMEFRAME_D1
                }
                mt5_tf = tf_map.get(timeframe.upper(), mt5.TIMEFRAME_M15)
                mt5.symbol_select(symbol, True)
                rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, bars)
                if rates is not None and len(rates) > 200:
                    df = pd.DataFrame(rates)
                    df['time'] = pd.to_datetime(df['time'], unit='s')
                    print(f"[FXFORGE DATA] Ingested {len(df):,} real {symbol} {timeframe} bars directly from MetaTrader 5.")
            except Exception as e:
                print(f"[FXFORGE DATA] MT5 Ingestion Warning: {e}")
            finally:
                mt5.shutdown()

        if df is None:
            print(f"[FXFORGE DATA] Synthesizing {bars:,} stochastic bars ({symbol} {timeframe}) with Geometric Brownian Motion & Volatility Clusters...")
            np.random.seed(1337)
            dt = 1.0 / 252.0
            base_price = 2400.0 if "XAU" in symbol or "GOLD" in symbol else (1.0850 if "EUR" in symbol else 65000.0)
            returns = np.random.normal(0.0001, 0.0028, bars)
            close = base_price * np.cumprod(1 + returns)
            high = close * (1 + np.abs(np.random.normal(0, 0.0015, bars)))
            low = close * (1 - np.abs(np.random.normal(0, 0.0015, bars)))
            open_p = np.roll(close, 1)
            open_p[0] = base_price
            volume = np.random.randint(100, 3500, bars)
            
            df = pd.DataFrame({
                'open': open_p, 'high': high, 'low': low, 'close': close, 'tick_volume': volume
            })
            
        return df

    @staticmethod
    def compute_state_features(df: pd.DataFrame, ret_lookbacks: list = [5, 10, 20], vol_window: int = 10, sma_period: int = 20) -> np.ndarray:
        p = df['close'].values.astype(np.float64)
        n = len(p)
        
        ret_a, ret_b, ret_c = ret_lookbacks[0], ret_lookbacks[1], ret_lookbacks[2]
        max_lookback = max(ret_c, vol_window, sma_period) + 5
        
        feat_matrix = np.zeros((n, 6), dtype=np.float32)
        
        for idx in range(max_lookback, n):
            r_a = (p[idx] - p[idx - ret_a]) / p[idx - ret_a] * 100.0
            r_b = (p[idx] - p[idx - ret_b]) / p[idx - ret_b] * 100.0
            r_c = (p[idx] - p[idx - ret_c]) / p[idx - ret_c] * 100.0
            
            volat = (np.std(p[idx - vol_window:idx + 1]) / p[idx]) * 100.0
            sma_val = np.mean(p[idx - sma_period:idx + 1])
            dist_sma = ((p[idx] - sma_val) / p[idx]) * 100.0
            
            feat_matrix[idx] = [r_a, r_b, r_c, volat, dist_sma, 0.0]
            
        return feat_matrix

# =========================================================================
# 4. QUANT TRADING ENVIRONMENT
# =========================================================================
class FXForgeRLEnvironment:
    def __init__(self, df: pd.DataFrame, features: np.ndarray, config: dict):
        self.df = df.reset_index(drop=True)
        self.features = features
        self.prices = df['close'].values
        self.n_steps = len(self.prices)
        
        self.spread = float(config.get('spread_pips', 0.15)) * 0.0001
        self.idle_penalty = abs(float(config.get('inactivity_penalty', 0.0005)))
        self.opp_cost = float(config.get('opp_cost_multiplier', 0.50))
        
        self.reset()

    def reset(self):
        self.current_step = 30
        self.position = 0 # -1 SHORT, 0 FLAT, +1 LONG
        self.entry_price = 0.0
        self.capital = 100000.0
        self.peak_capital = 100000.0
        self.trades = []
        self.equity_curve = [100000.0]
        return self._get_state()

    def _get_state(self):
        state = np.copy(self.features[self.current_step])
        state[5] = float(self.position)
        return state

    def step(self, action: int):
        price_now = self.prices[self.current_step]
        self.current_step += 1
        price_next = self.prices[self.current_step]
        
        target_pos = 0
        if action == 0: target_pos = 1   # BUY
        elif action == 2: target_pos = -1 # SELL
        else: target_pos = self.position  # HOLD

        trade_pnl = 0.0
        if target_pos != self.position:
            if self.position != 0:
                exit_price = price_now - (self.spread if self.position == 1 else -self.spread)
                ret = (exit_price - self.entry_price) / self.entry_price if self.position == 1 else (self.entry_price - exit_price) / self.entry_price
                trade_pnl = self.capital * ret
                self.capital += trade_pnl
                self.trades.append(ret)
                self.equity_curve.append(self.capital)
                self.peak_capital = max(self.peak_capital, self.capital)

            if target_pos != 0:
                self.entry_price = price_now + (self.spread if target_pos == 1 else -self.spread)

        market_move = (price_next - price_now) / price_now
        reward = 0.0
        if target_pos == 1:
            reward += market_move * 10.0
        elif target_pos == -1:
            reward -= market_move * 10.0
        else:
            reward -= self.idle_penalty * 10.0
            if abs(market_move) > 0.0015:
                reward -= (abs(market_move) * self.opp_cost) * 10.0

        if target_pos != self.position:
            reward -= self.spread * 10.0

        self.position = target_pos
        done = (self.current_step >= self.n_steps - 2)
        return self._get_state(), reward, done, {'capital': self.capital, 'trade_pnl': trade_pnl}

# =========================================================================
# 5. ONNX EXPORT (STANDALONE ZERO-LATENCY)
# =========================================================================
def export_standalone_onnx_to_mt5(model: nn.Module, state_dim: int = 6, export_name: str = "rl_trading_model.onnx"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    onnx_path = os.path.join(base_dir, export_name)
    model.eval()

    # Clean stale external data files
    for p in [onnx_path, onnx_path + ".data"]:
        if os.path.exists(p):
            try: os.remove(p)
            except Exception: pass

    class PureActorONNXWrapper(nn.Module):
        def __init__(self, m):
            super().__init__()
            self.m = m
        def forward(self, state):
            probs, _, _, _ = self.m(state)
            return probs

    wrapper = PureActorONNXWrapper(model)
    wrapper.eval()
    dummy_input = torch.randn(1, state_dim, dtype=torch.float32)

    try:
        # Strictly use legacy TorchScript export to ensure a single self-contained .onnx without .data splits
        torch.onnx.export(
            wrapper, dummy_input, onnx_path,
            export_params=True, opset_version=14, do_constant_folding=True,
            input_names=['state_input'], output_names=['action_probs'],
            dynamic_axes=None, dynamo=False
        )
        print(f"\n[OK] Single-File ONNX Model Generated: {onnx_path} ({os.path.getsize(onnx_path)} bytes)")
    except Exception as e:
        print(f"[ONNX Export Warning] Legacy fallback: {e}")
        traced = torch.jit.trace(wrapper, dummy_input)
        torch.onnx.export(
            traced, dummy_input, onnx_path,
            export_params=True, opset_version=14, do_constant_folding=True,
            input_names=['state_input'], output_names=['action_probs'],
            dynamic_axes=None, dynamo=False
        )

    # Search and Copy to MetaTrader 5 Terminal Directories
    appdata = os.getenv('APPDATA')
    if appdata:
        pattern = os.path.join(appdata, 'MetaQuotes', 'Terminal', '*', 'MQL5', 'Files')
        for target_dir in glob.glob(pattern):
            try:
                os.makedirs(target_dir, exist_ok=True)
                dest = os.path.join(target_dir, export_name)
                shutil.copy2(onnx_path, dest)
                print(f"[DEPLOY] Auto-copied to MT5 Files Directory: {dest}")
            except Exception as e:
                print(f"[WARNING] Could not copy to {target_dir}: {e}")

# =========================================================================
# 6. MAIN DYNAMIC TRAINING PIPELINE
# =========================================================================
def main():
    parser = argparse.ArgumentParser(description="FXForge Lab Dynamic Deep RL Training Engine")
    parser.add_argument("--config", type=str, default="pipeline_config.json", help="Path to pipeline configuration JSON")
    args = parser.parse_args()

    # Load Pipeline Config
    config = {
        'symbol': 'XAUUSD',
        'timeframe': 'M15',
        'bars_count': 10000,
        'strategy_preset': 'Standard Quant',
        'ret_lookbacks': [5, 10, 20],
        'vol_window': 10,
        'sma_period': 20,
        'hidden1_units': 64,
        'hidden1_activation': 'LeakyReLU',
        'has_dropout': True,
        'dropout_rate': 0.15,
        'has_layer_norm': True,
        'has_l2_decay': True,
        'l2_decay_rate': 0.0001,
        'hidden2_units': 32,
        'hidden2_activation': 'LeakyReLU',
        'has_residual': True,
        'spread_pips': 0.15,
        'inactivity_penalty': 0.0005,
        'opp_cost_multiplier': 0.50,
        'entropy_beta': 0.08,
        'total_episodes': 100,
        'lr': 0.0025
    }

    if os.path.exists(args.config):
        try:
            with open(args.config, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                config.update(loaded)
            print(f"[CONFIG] Loaded dynamic node configuration from: {args.config}")
        except Exception as e:
            print(f"[CONFIG] Error loading {args.config}: {e}")

    symbol = config['symbol']
    timeframe = config['timeframe']
    bars = int(config['bars_count'])
    episodes = int(config.get('total_episodes', 100))

    # Apply Preset Lookback Rules if present
    preset = config.get('strategy_preset', 'Standard Quant')
    if 'Fibonacci' in preset:
        config['ret_lookbacks'] = [3, 8, 21]
    elif 'Scalper' in preset:
        config['ret_lookbacks'] = [2, 5, 10]
    elif 'Macro' in preset:
        config['ret_lookbacks'] = [10, 25, 50]
    else:
        config['ret_lookbacks'] = [5, 10, 20]

    print("\n" + "="*80)
    print(f" FXFORGE LAB - DYNAMIC PIPELINE TRAINING ({symbol} {timeframe})")
    print(f" Preset: {preset} | Ret Windows: {config['ret_lookbacks']} | Architecture: 6 -> {config['hidden1_units']} ({config['hidden1_activation']}) -> {config['hidden2_units']} -> 3")
    print("="*80 + "\n")

    # 1. Ingest Data & Extract 6D Tensors
    df = MarketDataLoader.load_or_generate_data(symbol, timeframe, bars)
    features = MarketDataLoader.compute_state_features(
        df, config['ret_lookbacks'], int(config['vol_window']), int(config['sma_period'])
    )

    env = FXForgeRLEnvironment(df, features, config)
    model = DynamicFXForgeActorCritic(config)
    
    weight_decay = float(config.get('l2_decay_rate', 1e-4)) if config.get('has_l2_decay', True) else 0.0
    optimizer = optim.Adam(model.parameters(), lr=float(config.get('lr', 0.0025)), weight_decay=weight_decay)
    entropy_beta = float(config.get('entropy_beta', 0.08))

    start_time = time.time()
    for ep in range(1, episodes + 1):
        state = env.reset()
        log_probs = []
        rewards = []
        values = []
        entropies = []
        done = False

        while not done:
            st = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
            probs, val, h1, h2 = model(st)
            dist = Categorical(probs)
            action = dist.sample()

            next_state, reward, done, info = env.step(action.item())

            log_probs.append(dist.log_prob(action))
            values.append(val)
            rewards.append(reward)
            entropies.append(dist.entropy())

            state = next_state

        # Compute Generalized Discounted Returns
        returns = []
        R = 0
        for r in reversed(rewards):
            R = r + 0.95 * R
            returns.insert(0, R)

        returns = torch.tensor(returns, dtype=torch.float32)
        if len(returns) > 1 and returns.std() > 1e-8:
            returns = (returns - returns.mean()) / (returns.std() + 1e-8)

        values = torch.cat(values).squeeze(-1)
        log_probs = torch.stack(log_probs)
        entropies = torch.stack(entropies)
        advantages = returns - values.detach()

        actor_loss = -(log_probs * advantages).mean()
        critic_loss = 0.5 * (returns - values).pow(2).mean()
        entropy_loss = -entropy_beta * entropies.mean()

        total_loss = actor_loss + critic_loss + entropy_loss

        optimizer.zero_grad()
        total_loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        # Compute Real Quant Metrics
        trades = np.array(env.trades) if env.trades else np.array([])
        wins = int(np.sum(trades > 0)) if len(trades) > 0 else 0
        total_t = len(trades)
        win_rate = (wins / total_t * 100.0) if total_t > 0 else 0.0
        cum_ret = ((env.capital - 100000.0) / 100000.0) * 100.0
        
        std = np.std(trades) if len(trades) > 0 else 0.0
        sharpe = (np.mean(trades) / (std + 1e-7)) * np.sqrt(252.0) if std > 0 else 0.0

        if ep % 5 == 0 or ep == 1 or ep == episodes:
            elapsed = time.time() - start_time
            print(f"Episode {ep:03d}/{episodes} | Loss: {total_loss.item():.4f} | Reward: {sum(rewards):+6.2f} R | WinRate: {win_rate:5.1f}% | Sharpe: {sharpe:4.2f} | PnL: {cum_ret:+6.2f}% | Elapsed: {elapsed:.1f}s")
            
            # Emit structured JSON event line for UI IPC Listeners
            progress_payload = {
                "type": "progress",
                "episode": ep,
                "max_episodes": episodes,
                "loss": round(total_loss.item(), 4),
                "reward": round(sum(rewards), 2),
                "win_rate": round(win_rate, 1),
                "sharpe": round(sharpe, 2),
                "cum_return": round(cum_ret, 2),
                "trades": total_t
            }
            # Flush stdout for real-time IPC piping
            sys.stdout.flush()

    # Export Model
    export_standalone_onnx_to_mt5(model, state_dim=6, export_name="rl_trading_model.onnx")
    print(f"\n[DONE] Dynamic Training & 1-Click MT5 Deployment Completed Successfully!")

if __name__ == "__main__":
    main()
