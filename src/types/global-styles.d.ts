// Provide minimal typing for importing scss/css modules in TS
declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}
