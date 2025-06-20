﻿// Check if String.prototype.repeat is not supported (for older browsers)
if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        'use strict';

        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }

        var str = '' + this;
        count = +count;

        if (count != count) { // Check if count is NaN
            count = 0;
        }

        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }

        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }

        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }

        // Ensuring count is a 31-bit integer to avoid complexity
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }

        var result = '';
        for (; ;) {
            if ((count & 1) == 1) {
                result += str;
            }
            count >>>= 1;
            if (count == 0) {
                break;
            }
            str += str;
        }

        return result;
    };
}