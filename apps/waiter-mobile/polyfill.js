// Array.prototype.toReversed polyfill for Node.js < 20
if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function () {
        return this.slice().reverse();
    };
}
