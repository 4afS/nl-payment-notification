function test() {
  console.log(greet("Google App Script"));
}

const greet = (name: string) => {
  return `Hello,  ${name}`;
};
