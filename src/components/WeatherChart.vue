<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend
)

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  isNight: {
    type: Boolean,
    default: false,
  },
})

const canvasEl = ref(null)
let chartInstance = null

function buildOptions() {
  const textColor = props.isNight ? 'rgba(255,255,255,0.7)' : 'rgba(30,30,30,0.75)'
  const gridColor = props.isNight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: props.isNight ? 'rgba(20,24,40,0.92)' : 'rgba(255,255,255,0.95)',
        titleColor: props.isNight ? '#e0e6ff' : '#111',
        bodyColor: props.isNight ? '#a0aacc' : '#444',
        borderColor: props.isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toFixed(1)} °C`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor, font: { size: 11 } },
        grid: { color: gridColor },
        border: { display: false },
      },
      y: {
        ticks: {
          color: textColor,
          font: { size: 11 },
          callback: (v) => `${v}°`,
        },
        grid: { color: gridColor },
        border: { display: false },
      },
    },
  }
}

function createChart() {
  if (!canvasEl.value) return
  chartInstance = new Chart(canvasEl.value, {
    type: 'line',
    data: props.chartData,
    options: buildOptions(),
  })
}

function updateChart() {
  if (!chartInstance) return
  chartInstance.data = props.chartData
  chartInstance.options = buildOptions()
  chartInstance.update('active')
}

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

onMounted(createChart)
onBeforeUnmount(destroyChart)

watch(
  () => props.chartData,
  updateChart,
  { deep: true }
)

watch(
  () => props.isNight,
  updateChart
)
</script>

<template>
  <div class="weather-chart">
    <canvas ref="canvasEl" />
  </div>
</template>

<style lang="scss" scoped>
.weather-chart {
  position: relative;
  width: 100%;
  height: 180px;
}
</style>
