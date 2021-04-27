import { Chart, LineController, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
import $ from 'jquery'

import { ForecastItem } from './ForecastDomain'
import { format, parseISO } from 'date-fns'


export function showPointForecastLoadingPopup(): void {
  $('#popupContainer').css('display', '-webkit-flex')
  $('#popupContainer').css('display', 'flex')
  $('#popupContainer #forecastPopup').css('display', '-webkit-flex')
  $('#popupContainer #forecastPopup').css('display', 'flex')
  $('#popupContainer .spinner').show()
  $('.forecastData').empty().hide()
  $('.forecastHeader').hide()
}

export function showPointForecastPopup(forecastItems: ForecastItem[]): void {
  $('.forecastData').empty().show()
  $('.forecastHeader').show()
  $('#popupContainer .spinner').hide()

  const items = forecastItems || []
  const $forecastChart = $('<canvas id="forecastChart">')
  $('#forecastPopup .forecastData').append($forecastChart)

  const windSpeeds = items.map(item => item.windSpeedMs)
  const windDirs = items.map(item => item.windDir)
  const labels = items.map(item => format(parseISO(item.time), 'EEE HH'))

  const data = {
    labels: labels,
    datasets: [{
      label: 'Wind Speed',
      borderColor: 'rgba(0,153,255,0.8)',
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      data: windSpeeds,
      tension: 0.1
    }]
  }

  const options = {
    animation: false as false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      },
      x: {
        ticks: {
          maxTicksLimit: windSpeeds.length / 3
        }
      }
    }
  }

  Chart.register(LineController, CategoryScale, LinearScale, PointElement, LineElement)
  new Chart('forecastChart', { type: 'line', data, options })

  const $windDirContainer = $('<div class="windDirContainer">')
  windDirs.forEach(windDir => {
    $windDirContainer.append($('<span class="windDir">').text('\u2193')
      .css({
        '-webkit-transform': 'rotate(' + windDir + 'deg)',
        'transform': 'rotate(' + windDir + 'deg)'
      })
    )
  })
  $('.forecastData').append($windDirContainer)
}


