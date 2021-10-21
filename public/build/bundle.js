
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function self(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/pages/Gallary.svelte generated by Svelte v3.44.0 */
    const file$1 = "src/pages/Gallary.svelte";

    // (54:37) 
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "content-test4");
    			add_location(div, file$1, 54, 12, 1806);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(54:37) ",
    		ctx
    	});

    	return block;
    }

    // (52:37) 
    function create_if_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "content-test3");
    			add_location(div, file$1, 52, 12, 1725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(52:37) ",
    		ctx
    	});

    	return block;
    }

    // (50:37) 
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "content-test2");
    			add_location(div, file$1, 50, 12, 1644);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(50:37) ",
    		ctx
    	});

    	return block;
    }

    // (48:8) {#if content_index == 0}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "content-t1 svelte-1ikn2py");
    			set_style(div, "background-color", "red");
    			add_location(div, file$1, 48, 12, 1532);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(48:8) {#if content_index == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let div0;
    	let h30;
    	let t1;
    	let div1;
    	let h31;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let h32;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*content_index*/ ctx[2] == 0) return create_if_block;
    		if (/*content_index*/ ctx[2] == 1) return create_if_block_1;
    		if (/*content_index*/ ctx[2] == 2) return create_if_block_2;
    		if (/*content_index*/ ctx[2] == 3) return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Back";
    			t1 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "<";
    			t3 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t4 = space();
    			div3 = element("div");
    			h32 = element("h3");
    			h32.textContent = ">";
    			attr_dev(h30, "class", "svelte-1ikn2py");
    			add_location(h30, file$1, 44, 28, 1320);
    			attr_dev(div0, "id", "home");
    			attr_dev(div0, "class", "svelte-1ikn2py");
    			add_location(div0, file$1, 44, 4, 1296);
    			attr_dev(h31, "class", "arrow svelte-1ikn2py");
    			add_location(h31, file$1, 45, 70, 1410);
    			attr_dev(div1, "id", "prev");
    			attr_dev(div1, "class", "arrow-wrapper svelte-1ikn2py");
    			add_location(div1, file$1, 45, 4, 1344);
    			attr_dev(div2, "id", "content");
    			attr_dev(div2, "class", "svelte-1ikn2py");
    			add_location(div2, file$1, 46, 4, 1448);
    			attr_dev(h32, "class", "arrow svelte-1ikn2py");
    			add_location(h32, file$1, 57, 69, 1931);
    			attr_dev(div3, "id", "next");
    			attr_dev(div3, "class", "arrow-wrapper svelte-1ikn2py");
    			add_location(div3, file$1, 57, 4, 1866);
    			attr_dev(main, "id", "gallary-wrapper");
    			attr_dev(main, "class", "svelte-1ikn2py");
    			add_location(main, file$1, 43, 0, 1236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h30);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, h31);
    			append_dev(main, t3);
    			append_dev(main, div2);
    			if (if_block) if_block.m(div2, null);
    			/*div2_binding*/ ctx[7](div2);
    			append_dev(main, t4);
    			append_dev(main, div3);
    			append_dev(div3, h32);
    			/*main_binding*/ ctx[9](main);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(div3, "click", /*click_handler_2*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (if_block) {
    				if_block.d();
    			}

    			/*div2_binding*/ ctx[7](null);
    			/*main_binding*/ ctx[9](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const index_length = 4;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Gallary', slots, []);
    	let { shown = false } = $$props;
    	let content;
    	let content_index = 0;
    	let in_transition = false;
    	let gallary_wrapper;

    	onMount(() => {
    		
    	}); // gallary_wrapper = document.getElementById("gallary-wrapper"); 
    	// console.log(gallary_wrapper);

    	const next_item = num => {
    		if (in_transition) return;
    		in_transition = true;
    		$$invalidate(1, content.style.transform = "rotateY(90deg)", content);

    		setTimeout(
    			() => {
    				if (content_index + num >= index_length) $$invalidate(2, content_index = 0); else if (content_index + num < 0) $$invalidate(2, content_index = index_length - 1); else $$invalidate(2, content_index += num);

    				// Set next content item
    				$$invalidate(1, content.style.transform = "rotateY(0deg)", content);

    				setTimeout(
    					() => {
    						in_transition = false;
    					},
    					300
    				);
    			},
    			300
    		);
    	};

    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Gallary> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => next_item(-1);

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			content = $$value;
    			$$invalidate(1, content);
    		});
    	}

    	const click_handler_2 = () => next_item(1);

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			gallary_wrapper = $$value;
    			($$invalidate(0, gallary_wrapper), $$invalidate(4, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(4, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		shown,
    		content,
    		content_index,
    		index_length,
    		in_transition,
    		gallary_wrapper,
    		next_item
    	});

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(4, shown = $$props.shown);
    		if ('content' in $$props) $$invalidate(1, content = $$props.content);
    		if ('content_index' in $$props) $$invalidate(2, content_index = $$props.content_index);
    		if ('in_transition' in $$props) in_transition = $$props.in_transition;
    		if ('gallary_wrapper' in $$props) $$invalidate(0, gallary_wrapper = $$props.gallary_wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gallary_wrapper, shown*/ 17) {
    			{
    				$$invalidate(0, gallary_wrapper = document.getElementById("gallary-wrapper"));

    				if (gallary_wrapper != null) {
    					if (shown) {
    						$$invalidate(0, gallary_wrapper.style.transform = "translate(0, 0)", gallary_wrapper);
    					} else {
    						$$invalidate(0, gallary_wrapper.style.transform = "translate(100%, 0)", gallary_wrapper);
    					}
    				}
    			}
    		}
    	};

    	return [
    		gallary_wrapper,
    		content,
    		content_index,
    		next_item,
    		shown,
    		click_handler,
    		click_handler_1,
    		div2_binding,
    		click_handler_2,
    		main_binding
    	];
    }

    class Gallary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { shown: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gallary",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get shown() {
    		throw new Error("<Gallary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Gallary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div5;
    	let div4;
    	let div0;
    	let t3;
    	let div1;
    	let t5;
    	let div2;
    	let t7;
    	let div3;
    	let t9;
    	let gallary;
    	let current;
    	let mounted;
    	let dispose;

    	gallary = new Gallary({
    			props: { shown: /*show0*/ ctx[0] },
    			$$inline: true
    		});

    	gallary.$on("click", /*hide_gallary*/ ctx[5]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Jacoby's Art Porfolio";
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Gallary";
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "Best Art";
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "About Me";
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "Art History Timeline";
    			t9 = space();
    			create_component(gallary.$$.fragment);
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-qnlcj9");
    			add_location(h1, file, 51, 1, 1204);
    			attr_dev(div0, "class", "menu-txt svelte-qnlcj9");
    			add_location(div0, file, 54, 3, 1402);
    			attr_dev(div1, "class", "menu-txt svelte-qnlcj9");
    			add_location(div1, file, 55, 3, 1469);
    			attr_dev(div2, "class", "menu-txt svelte-qnlcj9");
    			add_location(div2, file, 56, 3, 1537);
    			attr_dev(div3, "class", "menu-txt svelte-qnlcj9");
    			add_location(div3, file, 57, 3, 1605);
    			attr_dev(div4, "id", "menu-txt-wrapper");
    			attr_dev(div4, "class", "svelte-qnlcj9");
    			add_location(div4, file, 53, 2, 1371);
    			attr_dev(div5, "id", "background");
    			attr_dev(div5, "class", "svelte-qnlcj9");
    			add_location(div5, file, 52, 1, 1247);
    			attr_dev(main, "id", "main-wrapper");
    			attr_dev(main, "class", "svelte-qnlcj9");
    			add_location(main, file, 50, 0, 1178);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t3);
    			append_dev(div4, div1);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			insert_dev(target, t9, anchor);
    			mount_component(gallary, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[7], false, false, false),
    					listen_dev(div2, "click", /*click_handler_2*/ ctx[8], false, false, false),
    					listen_dev(div3, "click", /*click_handler_3*/ ctx[9], false, false, false),
    					listen_dev(div5, "click", self(/*toggle_background*/ ctx[1]), false, false, false),
    					listen_dev(div5, "mouseenter", /*enter_background*/ ctx[2], false, false, false),
    					listen_dev(div5, "mouseleave", /*leave_background*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const gallary_changes = {};
    			if (dirty & /*show0*/ 1) gallary_changes.shown = /*show0*/ ctx[0];
    			gallary.$set(gallary_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gallary.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gallary.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t9);
    			destroy_component(gallary, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let background;
    	let main_wrapper;

    	onMount(() => {
    		background = document.getElementById("background");
    		main_wrapper = document.getElementById("main-wrapper");
    	}); // toggle_background();

    	let background_out = false;
    	let show0 = false;

    	const toggle_background = () => {
    		if (background_out) background.style.clipPath = "circle(2% at 75% 50%)"; else background.style.clipPath = "circle(100% at 75% 50%)";
    		background_out = !background_out;
    	};

    	const enter_background = () => {
    		if (!background_out) background.style.clipPath = "circle(3% at 75% 50%)";
    	};

    	const leave_background = () => {
    		if (!background_out) background.style.clipPath = "circle(2% at 75% 50%)";
    	};

    	const load_menu = i => {
    		switch (i) {
    			case 0:
    				$$invalidate(0, show0 = true);
    				break;
    		}

    		main_wrapper.style.transform = "translate(-100%, 0)";
    	}; // setTimeout(() => { toggle_background(); }, 300);

    	// setTimeout(() => { toggle_background(); load_menu(0); }, 500);
    	const hide_gallary = () => {
    		$$invalidate(0, show0 = false);
    		main_wrapper.style.transform = "translate(0, 0)";
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => load_menu(0);
    	const click_handler_1 = () => load_menu(1);
    	const click_handler_2 = () => load_menu(2);
    	const click_handler_3 = () => load_menu(3);

    	$$self.$capture_state = () => ({
    		onMount,
    		Gallary,
    		background,
    		main_wrapper,
    		background_out,
    		show0,
    		toggle_background,
    		enter_background,
    		leave_background,
    		load_menu,
    		hide_gallary
    	});

    	$$self.$inject_state = $$props => {
    		if ('background' in $$props) background = $$props.background;
    		if ('main_wrapper' in $$props) main_wrapper = $$props.main_wrapper;
    		if ('background_out' in $$props) background_out = $$props.background_out;
    		if ('show0' in $$props) $$invalidate(0, show0 = $$props.show0);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		show0,
    		toggle_background,
    		enter_background,
    		leave_background,
    		load_menu,
    		hide_gallary,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body, props: {} });

    return app;

})();
//# sourceMappingURL=bundle.js.map
