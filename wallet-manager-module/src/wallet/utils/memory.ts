export function wipeString(s: string | null | undefined): void {
  if (!s) return;
  // JS strings are immutable; callers must drop the reference too.
  // This helper exists as a single point to hook a native-side wipe later.
  void s;
}

export function wipeArray(arr: number[] | Uint8Array): void {
  if (arr instanceof Uint8Array) {
    arr.fill(0);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = 0;
  }
}
