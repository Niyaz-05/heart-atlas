import { expect, it } from 'vitest';
import { assertSourceOrder } from './check-citation-order.mjs';
it('prevents silent numeric citation retargeting, permits IDs and append-only sources', () => {
 const old=[{title:'A',url:'https://example.org/a'},{title:'B',url:'https://example.org/b'}];
 expect(()=>assertSourceOrder(old,[old[1],old[0]],true)).toThrow();
 expect(()=>assertSourceOrder(old,[{...old[0],id:'a'},{...old[1],id:'b'}],true)).not.toThrow();
 expect(()=>assertSourceOrder(old,[...old,{title:'C'}],true)).not.toThrow();
 expect(()=>assertSourceOrder(old,[old[1],old[0]],false)).not.toThrow();
});
