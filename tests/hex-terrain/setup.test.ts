import * as fc from 'fast-check';

describe('Test Environment Setup', () => {
    it('Jest is working', () => {
        expect(1 + 1).toBe(2);
    });

    it('fast-check is working', () => {
        fc.assert(
            fc.property(fc.integer(), fc.integer(), (a, b) => {
                return a + b === b + a;
            })
        );
    });
});
