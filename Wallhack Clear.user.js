// ==UserScript==
// @name         Wallhack Clear
// @version      1.0
// @description  Krunker.io Cheat
// @author       blxfck
// @match        *://krunker.io/*
// @run-at       document-start
// @grant        none
// @noframes
// @namespace    none
// ==/UserScript==
//******************************************************************************************************************
(function() {
    //'use strict';
    //======================================================================================>
    var count = 0,
        vars = {};
    const downKeys = new Set();
    const upKeys = new Set();
    const defined = object => typeof object !== "undefined";
    console.json = object => console.log(JSON.stringify(object, undefined, 2));
    let toJson = object => console.log(JSON.stringify(object, undefined, 2));
    let getDistance3D = (fromX, fromY, fromZ, toX, toY, toZ) => {
        var distX = fromX - toX,
            distY = fromY - toY,
            distZ = fromZ - toZ;
        return Math.sqrt(distX * distX + distY * distY + distZ * distZ);
    }

    let getDistance = (player1, player2) => {
        return getDistance3D(player1.x, player1.y, player1.z, player2.x, player2.y, player2.z);
    }

    let getDirection = (fromZ, fromX, toZ, toX) => {
        return Math.atan2(fromX - toX, fromZ - toZ);
    }

    let getXDir = (fromX, fromY, fromZ, toX, toY, toZ) => {
        var dirY = Math.abs(fromY - toY),
            dist = getDistance3D(fromX, fromY, fromZ, toX, toY, toZ);
        return Math.asin(dirY / dist) * (fromY > toY ? -1 : 1);
    }

    let getAngleDist = (start, end) => {
        return Math.atan2(Math.sin(end - start), Math.cos(start - end));
    }

    addEventListener("keydown", e => {
        if ("INPUT" == window.document.activeElement.tagName) return;
        const key = e.key.toUpperCase();
        const code = e.code;
        if (!downKeys.has(code)) downKeys.add(code);
    });

    addEventListener("keyup", e => {
        const key = e.key.toUpperCase();
        const code = e.code;
        if (downKeys.has(code)) downKeys.delete(code);
        if (!upKeys.has(code)) upKeys.add(code);
    })

    const Pi = Math.PI / 2;
    const PI2 = 2 * Math.PI;
    const consts = {
        cameraHeight: 1.5,
        playerHeight: 11,
        cameraHeight: 1.5,
        headScale: 2,
        crouchDst: 3,
        camChaseTrn: 0.0022,
        camChaseSpd: 0.0012,
        camChaseSen: 0.2,
        camChaseDst: 24,
        recoilMlt: 0.3,
        nameOffset: 0.6,
        nameOffsetHat: 0.8,
        verClans: [
            "DEV",
            "FaZe",
            "Lore",
            "nV",
            "Oxic",
            "Verb",
            "Omen",
            "ロリ幼女",
            "VOID",
            "JBP",
            "PHIL",
            "TIMP",
            "24/7",
            "g59",
            "GLXY",
            "MMOK",
            "ODTY"
        ],
    };
    const input = {
        speed: 1,
        ydir: 2,
        xdir: 3,
        shoot: 5,
        scope: 6,
        jump: 7,
        crouch: 8,
        reload: 9,
        weapon: 10,
    };
    let settings = {
        isSliding: false,
        distance: Infinity,
        scopingOut: false,
        canShoot: true,
    }

    function onTick(me, world, inputs, renderer) {
        'use strict';
        const controls = world.controls;
        let inView = (entity) => (null == world[vars.canSee](me, entity.x, entity.y, entity.z)) && (null == world[vars.canSee](renderer.camera[vars.getWorldPosition](), entity.x, entity.y, entity.z, 10));
        let isFriendly = (entity) => (me && me.team ? me.team : me.spectating ? 0x1 : 0x0) == entity.team;
        let keyDown = (code) => {
            return downKeys.has(code);
        }
        let keyUp = (code) => {
            if (upKeys.has(code)) {
                upKeys.delete(code);
                return true;
            }
            return false;
        }

        // auto bHop
        let autoBhop = (value) => {
            if (!value) return;
            if (keyDown("Space") || value == 1 || value == 3) {
                controls.keys[controls.jumpKey] = !controls.keys[controls.jumpKey];
                if (value >= 2) {
                    if (settings.isSliding) {
                        controls.keys[controls.crouchKey] = 1;
                        return;
                    }
                    if (me.yVel < -0.04 && me.canSlide) {
                        settings.isSliding = true;
                        setTimeout(() => {
                            settings.isSliding = false;
                            controls.keys[controls.crouchKey] = 0;
                        }, 350);
                        controls.keys[controls.crouchKey] = 1;
                    }
                }
            }
        }
        autoBhop(2);

        // auto reload
        const ammoLeft = me[vars.ammos][me[vars.weaponIndex]];
        if (!ammoLeft) inputs[input.reload] = 1;

    }

    function onRender(canvas, scale, world, renderer, me, scale2) {
        if (world && world.players) {
             world.players.list.map((entity, index, array)=> {
                if (defined(entity[vars.objInstances]) && entity[vars.objInstances]) {
                    for (let i = 0; i < entity[vars.objInstances].children.length; i++) {
                        const object3d = entity[vars.objInstances].children[i];
                        for (let j = 0; j < object3d.children.length; j++) {
                            const mesh = object3d.children[j];
                            if (mesh && mesh.type == "Mesh") {
                                const material = mesh.material;
                                material.depthTest = false;
                                material.colorWrite = true;
                                material.transparent = true;
                                material.opacity = 1.0;
                                material.wireframe = 1;
                            }
                        }
                    }
                }
            });
        }
        if (me) {
            // onTick Hook
            if (!defined(me.procInputs)) {
                // Do once:
                me.procInputs = me[vars.procInputs];
                me[vars.procInputs] = function() {
                    const inputs = arguments[0];
                    //const world = arguments[1];
                    onTick(this, world, inputs, renderer);
                    return me.procInputs(...arguments);
                }
            }
        }
    }

    function findVariables(script) {
        const regex = new Map()
            .set("procInputs", /this\['(\w+)']=function\((\w+),(\w+),\w+,\w+\){(this)/)
            .set("objInstances", /\[\w+\]\['\w+'\]=!\w+,this\['\w+'\]\[\w+\]\['\w+'\]&&\(this\['\w+'\]\[\w+\]\['(\w+)'\]\['\w+'\]=!\w+/)
            //renderYou //.set("isYou", /,this\['\w+'\]=!\w+,this\['\w+'\]=!\w+,this\['(\w+)'\]=\w+,this\['\w+'\]\['length'\]=\w+,this\[/)
            .set("cnBSeen", /\['(\w+)']=!0x0,!spectating/)
            .set("canSee", /,this\['(\w+)'\]=function\(\w+,\w+,\w+,\w+,\w+\){if\(!\w+\)return!\w+;/)
            .set("pchObjc", /\(\w+,\w+,\w+\),this\['(\w+)'\]=new \w+\['\w+'\]\(\)/)
            .set("recoilAnimY", /\w*1,this\['\w+'\]=\w*0,this\['\w+'\]=\w*0,this\['\w+'\]=\w*1,this\['\w+'\]=\w*1,this\['\w+'\]=\w*0,this\['\w+'\]=\w*0,this\['(\w+)'\]=\w*0,this\['\w+'\]=\w*0,this\['\w+'\]=\w*0,this\['\w+'\]=\w*0,/)
            .set("mouseDownL", /this\['\w+'\]=function\(\){this\['(\w+)'\]=\w*0,this\['(\w+)'\]=\w*0,this\['\w+'\]={}/)
            .set("mouseDownR", /this\['(\w+)']=0x0,this\['keys']=/)
            .set("getWorldPosition", /\['camera']\['(\w+)']\(\);if/)
            .set("maxHealth", /this\['health']\/this\['(\w+)']\?/)
            .set("didShoot", /\w+\['(\w+)']=!0x1,\w+\['burstCount']=0x0/)
            .set("ammos", /{!\w+\['reloadTimer']&&\w+\['(\w+)']/)
            .set("nAuto", /'(\w+)':!0x0,'burst':/)
            .set("weaponIndex", /\['reloadTimer']&&\w+\['\w+']\[\w+\['(\w+)']/)
        for (const [name, search] of regex) {
            const found = search.exec(script);
            if (!found) {
                alert(`Failed to find ${name}`);
                vars[name] = null;
                continue;
            } else {
                console.log("found ", name, " - ", found[1]);
                vars[name] = found[1];
            }
        }
    }

    class Hook {
        constructor(target, fn, blocking = false) {
            this.hook = {
                apply: function(_target, _this, _arguments) {
                    let _returnValue = _target.apply(_this, _arguments);
                    // uncomment for hook logs - skid
                    /*
                    console.log('//======================================================================================>');
                    console.log('HOOKED: ', _target.name, '\n');
                    console.log('Parent: ', _this);
                    console.log('Arguments: ', _arguments);
                    console.log('ReturnValue: ', _returnValue);
                    console.log('//======================================================================================>');
                    */

                    fn({
                        main: _this,
                        args: _arguments,
                        rv: _returnValue
                    });

                    if (!blocking) return _returnValue;
                }
            };
            return new Proxy(target, this.hook);
        }
    };

    //======================================================================================>

    TextEncoder.prototype.encodeInto = new Hook(TextEncoder.prototype.encodeInto, (params) => {
        const data = params.args;
        if (!count) {
            findVariables(data[0]);
        }
        count++;
    });

    const original_CRC2dSave = CanvasRenderingContext2D.prototype.save;
    CanvasRenderingContext2D.prototype.save = function() {
        const args = arguments.callee.caller.arguments;
        onRender(this.canvas, args[0], args[1], args[2], args[3], args[4]);
        return original_CRC2dSave.apply(this, arguments);
    }

    //======================================================================================>
})();