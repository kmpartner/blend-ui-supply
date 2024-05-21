export function scaleInputToBigInt(input: string, decimals: number): bigint {
  let scaled_input;
  if (input.includes('.')) {
    let [base, decimal] = input.split('.');
    scaled_input = `${base}${decimal}${'0'.repeat(decimals - decimal.length)}`;
  } else {
    scaled_input = `${input}${'0'.repeat(decimals)}`;
  }
  return BigInt(scaled_input);
}
