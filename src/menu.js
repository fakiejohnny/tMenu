import Hammer from 'hammerjs';

function select(el) {
    return document.querySelector(el);
}

function selectAll(el) {
    return document.querySelectorAll(el);
}

var body = select("body");
var nav = select("nav");
var icon = select("#hamburger");

var filter = document.createElement("DIV");
filter.id = "filter"
filter.style.opacity = "0";
filter.style.visibility = "hidden";
nav.parentElement.appendChild(filter);

export default class Menu {
    constructor(options) {
        delete Hammer.defaults.cssProps.userSelect;
        this.hammerBody = new Hammer(body);
        this.hammerNav = new Hammer(nav);

        this.hammerIcon = new Hammer(icon);
        this.hammerFilter = new Hammer(filter);

        this.translateX = 0;
        this.saturation = 0;

        this.overhang = 0;
        this.navWidth = 0;

        this.allowHammerMove = false;
        this.menuOpen = false;

        this.timeOut1 = null;

        this.optionsDefault = {
            zero: -20,
            secondsIn: 0.3,
            secondsOut: 0.45,
            overhangPercent: 0
        }

        this.options = {...this.optionsDefault, ...options};

        /* oder älter Object.assign(obj1, obj2); */

        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        this.start = this.start.bind(this);
        this.move = this.move.bind(this);
        this.end = this.end.bind(this);
        this.iconTap = this.iconTap.bind(this);
        this.filterTap = this.filterTap.bind(this);
        this.addHammer = this.addHammer.bind(this);
        this.startMove = this.startMove.bind(this);
        this.endMove = this.endMove.bind(this);
        this.endMoveToStart = this.endMoveToStart.bind(this);
        this.go = this.go.bind(this);
        this.transition = this.transition.bind(this);
        this.removeTransition = this.removeTransition.bind(this);

        this.transformProp = (function () {
            var testEl = document.createElement('div');
            if (testEl.style.transform == null) {
                var vendors = ['Webkit', 'Moz', 'ms'];
                for (var vendor in vendors) {
                    if (testEl.style[vendors[vendor] + 'Transform'] !== undefined) {
                        return vendors[vendor] + 'Transform';
                    }
                }
            }
            return 'transform';
        })();

        this.frame = null;
        this.touch = true;

        this.addHammer();

        this.drop = selectAll(".has-submenu");

        for (let i = 0; i < this.drop.length; i++) {
            this.drop[i].addEventListener("click", () => {
                this.drop[i].classList.toggle("d-active");
                this.resize();
            });
        }
        window.addEventListener("load", this.resize);
        window.addEventListener("resize", this.resize);
        this.resize();

    }
    addHammer() {
        this.hammerBody.on('panmove', this.move);
        this.hammerBody.on('panstart', this.start);
        this.hammerBody.on('panend', this.end);
        this.hammerBody.on('pancancel', this.end);
        this.hammerIcon.on('tap', this.iconTap);
        this.hammerFilter.on('tap', this.filterTap);
    }
    resize() {
        if (window.innerWidth < 992) {

            this.overhang = this.options.overhangPercent * window.innerHeight / 100;
            this.navWidth = nav.getBoundingClientRect().width + this.overhang;

            if (this.menuOpen === false) {
                this.endMoveToStart();
            } else {
                this.endMove();
            }

            if (this.touch === false) {
                this.touch = true;
                this.addHammer();
            }

        } else {
            if (this.touch) {
                this.touch = false;
                clearTimeout(this.timeOut1);
                this.reset();
            }
        }
    }

    reset() {
        nav.style.removeProperty("transform");
        nav.style.removeProperty("transition");
        nav.style.removeProperty("visibility");

        body.style.removeProperty("overflow");
        body.style.removeProperty("user-select");

        this.hammerBody.off('panmove', this.move);
        this.hammerBody.off('panstart', this.start);
        this.hammerBody.off('panend', this.end);
        this.hammerBody.off('pancancel', this.end);
        this.hammerIcon.off('tap', this.iconTap);
        this.hammerFilter.off('tap', this.filterTap);
    }
    start(ev) {
        if (ev.center.y > 0) {

            if (this.menuOpen === false) {
                if (ev.center.x < 50) {
                    this.startMove();
                }
            } else {
                this.startMove();
            }

        }
    }

    render() {
        nav.style[this.transformProp] = "translate3d(" + Math.round(this.translateX) + "px, 0px, 0px)";
        filter.style.opacity = this.saturation;
    }

    move(ev) {
        if (this.allowHammerMove) {

            /* translate */

            if (this.menuOpen) {
                this.translateX = ev.deltaX + this.overhang;
            } else {
                this.translateX = ev.deltaX - this.navWidth + this.overhang;
            }

            if (this.translateX > this.overhang) {
                this.translateX = this.overhang;
            }

            if (this.translateX < -this.navWidth + this.options.zero) {
                this.translateX = -this.navWidth + this.options.zero;
            }

            /* filter */

            this.saturation = (this.translateX + this.navWidth - this.overhang) / this.navWidth;

            if (this.saturation < 0) {
                this.saturation = 0;
            }

            this.frame = requestAnimationFrame(this.render);
        }
    }

    startMove() {
        this.allowHammerMove = true;

        this.removeTransition();
        this.go();
    }

    go() {
        clearTimeout(this.timeOut1);
        nav.style.visibility = "visible";
        filter.style.visibility = "visible";
        body.classList.add("user-select-none");
        body.style.overflow = "hidden";
    }

    endMove() {
        this.transition(this.options.secondsIn);
        this.menuOpen = true;

        this.hammerBody.get('pan').set({
            threshold: 10
        });

        nav.style[this.transformProp] = "translate3d(" + Math.round(this.overhang) + "px, 0px, 0px)";
        this.translateX = this.overhang;
        filter.style.opacity = "1";
        this.saturation = 1;
    }

    endMoveToStart() {
        this.transition(this.options.secondsOut);
        this.menuOpen = false;

        this.hammerBody.get('pan').set({
            threshold: 0
        });

        body.style.overflow = "auto";
        body.classList.remove("user-select-none");
        nav.style[this.transformProp] = "translate3d(" + Math.round(-this.navWidth + this.options.zero) + "px, 0px, 0px)";
        this.translateX = -this.navWidth + this.options.zero;

        filter.style.opacity = "0";
        this.saturation = 0;

        this.timeOut1 = setTimeout(() => {
            if (this.touch) {
                nav.style.visibility = "hidden";
                filter.style.visibility = "hidden";
            }
        }, this.options.secondsOut * 1000);
    }

    transition(s) {
        nav.style.transition = [this.transformProp] + " " + s + "s cubic-bezier(0.0, 0.0, 0.2, 1)";
        filter.style.transition = "opacity " + s + "s cubic-bezier(0.0, 0.0, 0.2, 1)";
    }

    removeTransition() {
        filter.style.removeProperty("transition");
        nav.style.removeProperty("transition");
    }

    end(ev) {
        if (this.allowHammerMove) {

            cancelAnimationFrame(this.frame);

            this.allowHammerMove = false;

            if (this.menuOpen === false) {
                if (ev.deltaX > this.navWidth * 0.5 || ev.velocityX > 0.25) {
                    this.endMove();
                } else {
                    this.endMoveToStart();
                }
            } else {
                if (ev.deltaX < -this.navWidth * 0.5 || ev.velocityX < -0.25) {
                    this.endMoveToStart();
                } else {
                    this.endMove();
                }
            }
        }
    }

    iconTap() {
        if (this.touch) {
            this.go();
            this.endMove();
        }
    }
    filterTap() {
        if (this.touch) {
            this.endMoveToStart();
        }
    }

}