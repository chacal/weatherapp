import noUiSlider = require('nouislider')

export default class NavigationSlider {
  private sliderElem: noUiSlider.Instance

  constructor(private domElementId: string, private hoursPerSliderStep: number) {
    this.sliderElem = document.getElementById(domElementId) as noUiSlider.Instance
  }

  initialize(minValue: number, maxValue: number): noUiSlider.noUiSlider {
    const oldSliderValue = this.getValue()

    if(oldSliderValue !== undefined)
      this.destroySlider()

    noUiSlider.create(this.sliderElem, {
      start: oldSliderValue || 0,
      connect: [true, false],
      animate: false,
      range: {
        min: minValue,
        max: maxValue
      },
      step: this.hoursPerSliderStep,
      format: {
        to: value => Math.round(value),
        from: value => Math.round(value)
      }
    })

    return this.sliderElem.noUiSlider
  }

  getValue(): number { return this.sliderElem.noUiSlider ? parseInt(this.sliderElem.noUiSlider.get() as string): undefined }
  setValue(newValue: number) { this.sliderElem.noUiSlider.set(newValue) }
  destroySlider() { this.sliderElem.noUiSlider.destroy() }
}
