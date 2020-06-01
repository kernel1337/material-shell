const { St, GObject, Clutter } = imports.gi;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const { ShellVersionMatch } = Me.imports.src.utils.compatibility;

const { RippleBackground } = Me.imports.src.widget.material.rippleBackground;
const Animation = imports.ui.animation;

/* exported AppPlaceholder */
var AppPlaceholder = GObject.registerClass(
    {
        GTypeName: 'AppPlaceholder',
        Signals: {
            clicked: {
                param_types: [GObject.TYPE_INT],
            },
        },
    },
    class AppPlaceholder extends St.Widget {
        _init(app) {
            super._init({
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                layout_manager: new Clutter.BinLayout(),
                reactive: true,
            });

            this.app = app;
            this.icon = this.app.create_icon_texture(248);

            this.spinnerContainer = new Clutter.Actor({});
            this.spinnerContainer.set_opacity(0);
            this.appTitle = new St.Label({
                text: app.get_name(),
                x_align: Clutter.ActorAlign.CENTER,
                style_class: 'headline-4',
                style: 'margin-top:48px',
            });

            this.callToAction = new St.Label({
                text: 'Click anywhere to launch',
                x_align: Clutter.ActorAlign.CENTER,
                style_class: 'headline-5 text-medium-emphasis',
                style: 'margin-top:32px;margin-bottom:16px;',
            });

            this.identityContainer = new Clutter.Actor({
                layout_manager: new Clutter.BoxLayout({
                    vertical: true,
                }),
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                y_expand: true,
            });

            [
                this.icon,
                this.appTitle,
                this.callToAction,
                this.spinnerContainer,
            ].forEach((actor) => this.identityContainer.add_child(actor));

            this.add_style_class_name('surface-darker');
            this.add_child(this.identityContainer);
            this.clickableContainer = new RippleBackground(this);
            this.clickableContainer.x_expand = true;
            this.clickableContainer.y_expand = true;
            this.add_child(this.clickableContainer);

            this.connect('event', (actor, event) => {
                let eventType = event.type();
                if (
                    [
                        Clutter.EventType.BUTTON_PRESS,
                        Clutter.EventType.TOUCH_BEGIN,
                    ].indexOf(eventType) > -1
                ) {
                    this.pressed = true;
                } else if (
                    [
                        Clutter.EventType.BUTTON_RELEASE,
                        Clutter.EventType.TOUCH_END,
                    ].indexOf(eventType) > -1
                ) {
                    if (this.pressed && !this.waitForReset) {
                        this.waitForReset = true;
                        this.emit('clicked', event.get_button());
                        this.pressed = false;
                        this.clickableContainer.reactive = false;
                        this._spinner = new Animation.Spinner(16);
                        let spinnerActor;
                        if (ShellVersionMatch('3.34')) {
                            spinnerActor = this._spinner.actor;
                        } else {
                            spinnerActor = this._spinner;
                        }
                        this.spinnerContainer.add_child(spinnerActor);
                        this._spinner.play();
                        this.spinnerContainer.set_opacity(255);
                    }
                } else if (eventType === Clutter.EventType.LEAVE) {
                    this.pressed = false;
                }
            });
        }

        reset() {
            this.clickableContainer.reactive = true;
            if (this._spinner) {
                if (ShellVersionMatch('3.34')) {
                    this._spinner.actor.destroy();
                } else {
                    this._spinner.destroy();
                }
                this._spinner.destroy();
            }
            this.spinnerContainer.set_opacity(0);
            delete this.waitForReset;
        }
    }
);
