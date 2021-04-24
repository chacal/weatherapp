import noUiSlider from 'nouislider'
import 'nouislider/distribute/nouislider.css'

export default class NavigationSlider {
  private sliderElem: noUiSlider.Instance

  constructor(private domElementId: string) {
    this.sliderElem = document.getElementById(domElementId) as noUiSlider.Instance
  }

  initialize(minValue: number, maxValue: number, step: number): noUiSlider.noUiSlider {
    noUiSlider.create(this.sliderElem, {
      start: 0,
      connect: [true, false],
      animate: false,
      range: {
        min: minValue,
        max: maxValue
      },
      step,
      format: {
        to: (value: number) => Math.round(value),
        from: (value: number) => Math.round(value)
      }
    })

    return this.sliderElem.noUiSlider
  }

  getValue(): number {
    return parseInt(this.sliderElem.noUiSlider.get() as string)
  }

  setValue(newValue: number) {
    this.sliderElem.noUiSlider.set(newValue)
  }
}
