
(function(global) {

    function setPixed(imageData, x, y, pixel) {
        var begin = (y * imageData.width + x) * 4;
        Array.prototype.splice.call(imageData.data, begin, 4, pixel[0], pixel[1], pixel[2], pixel[3]);
    }

    function getPixel(imageData, x, y) {
        var begin = (y * imageData.width + x) * 4;
        return Array.prototype.slice.call(imageData.data, begin, begin + 4);
    }

    function scale(imageData, dest) {
        var x, y, srcx, srcy;

        var destImageData = {
            width: dest.width,
            height: dest.height,
            data: new Array(dest.width * dest.height * 4)
        };

        for (x = 0; x < dest.width; x++) {
            for (y = 0; y < dest.height; y++) {
                srcx = Math.round(x * imageData.width / dest.width);
                srcy = Math.round(y * imageData.height / dest.height);

                setPixed(destImageData, x, y, getPixel(imageData, srcx, srcy));
            }
        }

        return destImageData;
    }

    function getRect(imageData, x, y, width, height) {
        var destImageData = ctx.createImageData(width, height);

        var data = imageData.data,
            count = 0;

        for (var i = y; i < y + height; i++) {
            var start = i * imageData.width + x;

            var lineData = Array.prototype.slice.call(data, start * 4, start * 4 + width * 4);

            Array.prototype.splice.apply(destImageData.data, [count, lineData.length].concat(lineData));

            count += lineData.length;
        }

        return destImageData;
    }

    function getDistance(x, y) {
        return Math.round(Math.sqrt(x * x + y * y));
    }


    function pinch(imageData, target) {

        var x, y;

        var destImageData = document.createElement('canvas').getContext('2d').createImageData(imageData.width, imageData.height);

        var radius = imageData.width / 2;

        for (x = 0; x < imageData.width; x++) {
            for (y = 0; y < imageData.height; y++) {

                var currentTarget = {
                    x: target.x * (y < radius ? y / radius : (radius * 2 - y) / radius),
                    y: target.y * (x < radius ? x / radius : (radius * 2 - x) / radius)
                }, srcx, srcy;

                if (x <= imageData.width / 2 + currentTarget.x) {
                    srcx = Math.round(x *  (imageData.width / 2) / (imageData.width / 2 + currentTarget.x));
                } else {
                    srcx = imageData.width - Math.round((imageData.width - x) * (imageData.width / 2) / (imageData.width / 2 - currentTarget.x));
                }

                if (y <= imageData.height / 2 + currentTarget.y) {
                    srcy = Math.round(y * (imageData.height / 2) / (imageData.height / 2 + currentTarget.y));
                } else {
                    srcy = imageData.height - Math.round((imageData.height - y) * (imageData.height / 2) / (imageData.height / 2 - currentTarget.y));
                }

                setPixed(destImageData, x, y, getPixel(imageData, srcx, srcy));
            }
        }

        return destImageData;
    }

    var settings = {
        // 影响范围
        rangeRatio: 2
    },
    support = !!document.createElement('canvas').getContext;

    function initFacePincher(canvas, src, settings) {
        if (!support) {
            document.write('请使用chrome');
            return;
        }

        var img = new Image(),
            ctx = canvas.getContext('2d');

        var isTouchDevice = 'ontouchstart' in window;

        img.src = src;

        img.onload = function() {

            ctx.drawImage(img, 0, 0);

            var srcX, srcY, destX, destY;

            canvas.onmousedown = function(e) {
                srcX = e.offsetX;
                srcY = e.offsetY;
                return false;
            }

            canvas.onmousemove = function(e) {
                if (e.which !== 1 && !isTouchDevice) {
                    return false;
                }
                destX = e.offsetX;
                destY = e.offsetY;

                process(ctx, img, {
                    x: srcX,
                    y: srcY
                }, {
                    x: destX - srcX,
                    y: destY - srcY
                });
            }

            canvas.onmouseup = function(e) {
                destX = e.offsetX;
                destY = e.offsetY;

                animation.move(ctx, img, {
                    x: srcX,
                    y: srcY
                }, {
                    x: destX - srcX,
                    y: destY - srcY
                });
            }
        }
    }

    function process(ctx, img, from, displacement) {

        if (displacement.x > 50) {
            displacement.x = 50;
        }
        if (displacement.y > 50) {
            displacement.y = 50;
        }

        ctx.drawImage(img, 0, 0);

        var radius = settings.rangeRatio * getDistance(displacement.x, displacement.y);

        if (!radius) {
            return;
        }

        var imageData = ctx.getImageData(from.x - radius, from.y - radius, radius * 2, radius * 2);

        ctx.putImageData(pinch(imageData, displacement), from.x - radius, from.y - radius);
    }

    var animation = {
        keyframes: [],
        interval: 100,
        animate: function() {

        },
        move: function(ctx, img, from, displacement, callback) {
            if (displacement.x || displacement.y) {
                var self = this;
                displacement.x = Math.floor(displacement.x / 2);
                displacement.y = Math.floor(displacement.y / 2);

                displacement.x = displacement.x > 10 ? displacement.x : 0;
                displacement.y = displacement.y > 10 ? displacement.x : 0;

                process(ctx, img, from, displacement);
                clearTimeout(this.timer);
                this.timer = setTimeout(function() {
                    self.move.call(self, ctx, img, from, displacement, callback);
                }, this.interval);
            }
            else {
                if (typeof callback === 'function') {
                    callback.call(this);
                }
            }
        }
    }

    global.facePincher = {
        pinch: pinch,
        getDistance: getDistance,
        init: initFacePincher,
        support: support,
        animation: animation
    };
}) (this);