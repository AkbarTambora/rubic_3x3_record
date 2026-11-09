import json
import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

def format_seconds(sec):
    if sec is None or np.isnan(sec):
        return ""
    m = int(sec // 60)
    s = int(sec % 60)
    ms = int(round((sec - int(sec)) * 100))
    return f"{m:02d}:{s:02d}.{ms:02d}"

def calculate_wca_avg(times_list):
    if len(times_list) < 3:
        return None
    sorted_times = sorted(times_list)
    trimmed = sorted_times[1:-1]
    return sum(trimmed) / len(trimmed)

def load_data():
    json_path = os.path.join(os.path.dirname(__file__), "solves.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [item["seconds"] for item in data]
    return [
        134.00, 111.24, 122.91, 120.02, 112.31, 112.12,
        107.94, 120.75, 103.62, 88.62, 93.34, 110.42,
        110.66, 104.40, 112.57, 149.44
    ]

def plot_records():
    times = load_data()
    n = len(times)
    indices = np.arange(1, n + 1)

    # Ao5
    ao5 = [np.nan] * n
    for i in range(4, n):
        ao5[i] = calculate_wca_avg(times[i-4:i+1])

    # Ao12
    ao12 = [np.nan] * n
    for i in range(11, n):
        ao12[i] = calculate_wca_avg(times[i-11:i+1])

    # Overall stats
    mean_val = np.mean(times)
    pb_val = np.min(times)
    pb_idx = np.argmin(times) + 1
    worst_val = np.max(times)

    # Trendline
    z = np.polyfit(indices, times, 1)
    p = np.poly1d(z)
    trend = p(indices)

    # Dark Theme Styling
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(13, 7), dpi=150)
    fig.patch.set_facecolor('#090b0e')
    ax.set_facecolor('#111622')

    # Grid
    ax.grid(True, linestyle='--', alpha=0.3, color='#1c2638', zorder=1)

    # Plot lines
    ax.plot(indices, times, marker='o', markersize=6, color='#3b82f6', linewidth=2.2, label='Solve Time (Single)', zorder=4)
    ax.plot(indices, ao5, marker='s', markersize=5, color='#f59e0b', linewidth=2.5, label='Rolling Ao5', zorder=5)
    ax.plot(indices, ao12, marker='^', markersize=5, color='#06b6d4', linewidth=2.5, label='Rolling Ao12', zorder=6)
    ax.plot(indices, trend, linestyle=':', color='#8b5cf6', linewidth=2, label=f'Trendline ({z[0]:+.2f}s/solve)', zorder=3)
    ax.axhline(mean_val, color='#94a3b8', linestyle='--', linewidth=1.5, alpha=0.7, label=f'Overall Mean ({format_seconds(mean_val)})', zorder=2)

    # Highlight PB
    ax.scatter([pb_idx], [pb_val], color='#10b981', s=160, zorder=7, edgecolors='white', linewidth=2, label=f'Personal Best ({format_seconds(pb_val)})')
    ax.annotate(
        f'PB: {format_seconds(pb_val)}\n(Solve #{pb_idx})',
        xy=(pb_idx, pb_val),
        xytext=(pb_idx + 0.3, pb_val - 12),
        arrowprops=dict(facecolor='#10b981', shrink=0.08, width=1.5, headwidth=7),
        fontsize=10,
        fontweight='bold',
        color='#10b981',
        bbox=dict(boxstyle="round,pad=0.4", fc="#0d211a", ec="#10b981", lw=1.2)
    )

    # Highlight Worst
    worst_idx = np.argmax(times) + 1
    ax.annotate(
        f'Worst: {format_seconds(worst_val)}',
        xy=(worst_idx, worst_val),
        xytext=(worst_idx - 1.8, worst_val + 5),
        arrowprops=dict(facecolor='#ef4444', shrink=0.08, width=1.2, headwidth=6),
        fontsize=9,
        color='#f87171',
        bbox=dict(boxstyle="round,pad=0.3", fc="#2d1515", ec="#ef4444", lw=1)
    )

    # Axes & Labels
    ax.set_title("Rubik's Cube 3x3 - Time Progression & Speedcubing Telemetry", fontsize=15, fontweight='bold', pad=18, color='#f8fafc')
    ax.set_xlabel("Solve Number (#)", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
    ax.set_ylabel("Solve Time", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
    
    ax.set_xticks(indices)
    ax.set_xlim(0.5, n + 0.5)

    def y_fmt(x, pos):
        return format_seconds(x)
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(y_fmt))

    # Legend
    legend = ax.legend(loc='upper right', framealpha=0.9, facecolor='#111622', edgecolor='#1c2638', fontsize=9.5)
    for text in legend.get_texts():
        text.set_color('#f8fafc')

    for spine in ax.spines.values():
        spine.set_color('#1c2638')

    output_png = os.path.join(os.path.dirname(__file__), "rubik_progress_chart.png")
    plt.tight_layout()
    plt.savefig(output_png, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    print(f"Chart successfully saved to: {output_png}")

if __name__ == "__main__":
    plot_records()
