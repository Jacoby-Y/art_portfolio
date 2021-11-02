
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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
    function empty() {
        return text('');
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    /* src/pages/Gallery.svelte generated by Svelte v3.44.0 */
    const file$6 = "src/pages/Gallery.svelte";

    // (60:37) 
    function create_if_block_5$1(ctx) {
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Self Portrait";
    			t1 = space();
    			iframe = element("iframe");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$6, 60, 12, 3471);
    			attr_dev(iframe, "class", "content-t1 svelte-1vknq4o");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vQPxsFNlB7yjelF_J_DyURYz7S_RdiRuxis-kb0lbkWBgQY-4RXyiJmjy2JWtx2RgQuMdbm_vQmPDUo/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			add_location(iframe, file$6, 61, 12, 3528);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, iframe, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(60:37) ",
    		ctx
    	});

    	return block;
    }

    // (57:37) 
    function create_if_block_4$1(ctx) {
    	let h3;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Mini Masterpiece";
    			t1 = space();
    			div = element("div");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$6, 57, 12, 3079);
    			attr_dev(div, "class", "content-t1 svelte-1vknq4o");
    			set_style(div, "background-image", "url('https://lh3.googleusercontent.com/pw/AM-JKLVRd-vzpdbhyN2q5-BuNdOlHLJlLpxwi3TIVoGVcFs--0IKAEjF0MucJUBGqgdaog9N_Z84GSsNAMFA5aVZKXTciOp7O3rorj4V6qljisZLkxDqR74rwKkYpBasuvvxdqatCzzbTDSVGMuyEbPyKZo=w726-h968-no?authuser=0')");
    			add_location(div, file$6, 58, 12, 3139);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(57:37) ",
    		ctx
    	});

    	return block;
    }

    // (54:37) 
    function create_if_block_3$1(ctx) {
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Landscape";
    			t1 = space();
    			iframe = element("iframe");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$6, 54, 12, 2669);
    			attr_dev(iframe, "class", "content-t1 svelte-1vknq4o");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vQtikX7NdEO0CMtUWLT1R4xkEAutLYAGDFR8zrJ0CAFamzYOBdnKVg2fcpvHbaud1Gzns0mgLppf8Ri/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			add_location(iframe, file$6, 55, 12, 2722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, iframe, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(54:37) ",
    		ctx
    	});

    	return block;
    }

    // (51:37) 
    function create_if_block_2$1(ctx) {
    	let h3;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Graffiti Tag";
    			t1 = space();
    			div = element("div");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$6, 51, 12, 2280);
    			attr_dev(div, "class", "content-t1 svelte-1vknq4o");
    			set_style(div, "background-image", "url('https://lh3.googleusercontent.com/pw/AM-JKLUxkKdg-9Y4OMqZHzTDM5EI7K3kuMukSnFsJkXW3SPpLEZmQxRMpSNEPzH8kR8BNd4s247YN-CnQn6490aXB5NF1Etuc-085XOyguTXJRreRDwfrMuwGczfppmK1BnuBstwm7vIJn-WTE8o7EjYguf5=w886-h664-no?authuser=0')");
    			add_location(div, file$6, 52, 12, 2336);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(51:37) ",
    		ctx
    	});

    	return block;
    }

    // (48:37) 
    function create_if_block_1$1(ctx) {
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Still Life";
    			t1 = space();
    			iframe = element("iframe");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$6, 48, 12, 1869);
    			attr_dev(iframe, "class", "content-t1 svelte-1vknq4o");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vS6jKySpeou-WNnnurn50VyhgNF5lpL2fDX1kshzhgcUo75I-9htD1TzqEvstwqFcI20rrbsLpvQYHQ/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			add_location(iframe, file$6, 49, 12, 1923);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, iframe, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(48:37) ",
    		ctx
    	});

    	return block;
    }

    // (45:8) {#if content_index == 0}
    function create_if_block$1(ctx) {
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Sketchbook Cover";
    			t1 = space();
    			iframe = element("iframe");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$6, 45, 12, 1452);
    			attr_dev(iframe, "class", "content-t1 svelte-1vknq4o");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vS85J7JE5USLCSCVCoYG5fTDK1cu3ptFHAoP8LmrwqfyPmsgpMN3lPmVG714AFXoeooH0jBqLaGyQ8V/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			add_location(iframe, file$6, 46, 12, 1512);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, iframe, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(45:8) {#if content_index == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
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
    		if (/*content_index*/ ctx[2] == 0) return create_if_block$1;
    		if (/*content_index*/ ctx[2] == 1) return create_if_block_1$1;
    		if (/*content_index*/ ctx[2] == 2) return create_if_block_2$1;
    		if (/*content_index*/ ctx[2] == 3) return create_if_block_3$1;
    		if (/*content_index*/ ctx[2] == 4) return create_if_block_4$1;
    		if (/*content_index*/ ctx[2] == 5) return create_if_block_5$1;
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
    			add_location(h30, file$6, 41, 31, 1240);
    			attr_dev(div0, "class", "home");
    			add_location(div0, file$6, 41, 4, 1213);
    			attr_dev(h31, "class", "arrow svelte-1vknq4o");
    			add_location(h31, file$6, 42, 70, 1330);
    			attr_dev(div1, "id", "prev");
    			attr_dev(div1, "class", "arrow-wrapper svelte-1vknq4o");
    			add_location(div1, file$6, 42, 4, 1264);
    			attr_dev(div2, "id", "content");
    			attr_dev(div2, "class", "svelte-1vknq4o");
    			add_location(div2, file$6, 43, 4, 1368);
    			attr_dev(h32, "class", "arrow svelte-1vknq4o");
    			add_location(h32, file$6, 64, 69, 3929);
    			attr_dev(div3, "id", "next");
    			attr_dev(div3, "class", "arrow-wrapper svelte-1vknq4o");
    			add_location(div3, file$6, 64, 4, 3864);
    			attr_dev(main, "class", "comp-main svelte-1vknq4o");
    			add_location(main, file$6, 40, 0, 1164);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const index_length = 6;

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Gallery', slots, []);
    	let { shown = false } = $$props;
    	let content;
    	let content_index = 0;
    	let in_transition = false;
    	let wrapper;

    	onMount(() => {
    		
    	});

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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Gallery> was created with unknown prop '${key}'`);
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
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(4, shown));
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
    		wrapper,
    		next_item
    	});

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(4, shown = $$props.shown);
    		if ('content' in $$props) $$invalidate(1, content = $$props.content);
    		if ('content_index' in $$props) $$invalidate(2, content_index = $$props.content_index);
    		if ('in_transition' in $$props) in_transition = $$props.in_transition;
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 17) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						setTimeout(
    							() => {
    								$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    							},
    							10
    						);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*wrapper, shown*/ 17) {
    			{
    				if (wrapper != undefined) {
    					if (shown) $$invalidate(0, wrapper.style.opacity = "1", wrapper); else $$invalidate(0, wrapper.style.opacity = "0", wrapper);
    				}
    			}
    		}
    	};

    	return [
    		wrapper,
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

    class Gallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { shown: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gallery",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get shown() {
    		throw new Error("<Gallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Gallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/AboutMe.svelte generated by Svelte v3.44.0 */

    const file$5 = "src/pages/AboutMe.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let div0;
    	let h30;
    	let t1;
    	let div2;
    	let div1;
    	let t2;
    	let h31;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Back";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "I am a passionate computer programmer and... that's basically it! Thanks for coming to my TED talk, I'll see you later folks!";
    			add_location(h30, file$5, 20, 31, 530);
    			attr_dev(div0, "class", "home");
    			add_location(div0, file$5, 20, 4, 503);
    			attr_dev(div1, "class", "about-me-img svelte-fslmg2");
    			add_location(div1, file$5, 23, 8, 671);
    			attr_dev(h31, "id", "about-me-txt");
    			attr_dev(h31, "class", "svelte-fslmg2");
    			add_location(h31, file$5, 24, 8, 712);
    			attr_dev(div2, "class", "about-wrapper abso-cen svelte-fslmg2");
    			add_location(div2, file$5, 21, 4, 554);
    			attr_dev(main, "class", "comp-main svelte-fslmg2");
    			add_location(main, file$5, 19, 0, 454);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h30);
    			append_dev(main, t1);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			append_dev(div2, t2);
    			append_dev(div2, h31);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AboutMe', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;
    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AboutMe> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						setTimeout(
    							() => {
    								$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    							},
    							10
    						);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != undefined) {
    					if (shown) $$invalidate(0, wrapper.style.opacity = "1", wrapper); else $$invalidate(0, wrapper.style.opacity = "0", wrapper);
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class AboutMe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutMe",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get shown() {
    		throw new Error("<AboutMe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<AboutMe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/BestArt.svelte generated by Svelte v3.44.0 */

    const file$4 = "src/pages/BestArt.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div;
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			t1 = space();
    			iframe = element("iframe");
    			add_location(h3, file$4, 20, 31, 530);
    			attr_dev(div, "class", "home");
    			add_location(div, file$4, 20, 4, 503);
    			attr_dev(iframe, "id", "slides");
    			attr_dev(iframe, "title", "Best artwork");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vQB_4gWFfBFnah6zQt0qnuSUKiOnIiLViX_1qyNY1jVNpVrAKmMxXTdhvCfgmXTCgScQox9xaQOT4Hn/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			attr_dev(iframe, "class", "svelte-1s2efni");
    			add_location(iframe, file$4, 21, 4, 554);
    			attr_dev(main, "class", "comp-main svelte-1s2efni");
    			add_location(main, file$4, 19, 0, 454);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			append_dev(main, t1);
    			append_dev(main, iframe);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BestArt', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;
    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BestArt> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						setTimeout(
    							() => {
    								$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    							},
    							10
    						);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != undefined) {
    					if (shown) $$invalidate(0, wrapper.style.opacity = "1", wrapper); else $$invalidate(0, wrapper.style.opacity = "0", wrapper);
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class BestArt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BestArt",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get shown() {
    		throw new Error("<BestArt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<BestArt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Timeline.svelte generated by Svelte v3.44.0 */

    const file$3 = "src/pages/Timeline.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let div;
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			t1 = space();
    			iframe = element("iframe");
    			add_location(h3, file$3, 20, 31, 530);
    			attr_dev(div, "class", "home");
    			add_location(div, file$3, 20, 4, 503);
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vTEtC6AKf75Hf6b-iZOveZYoYdUi6JowmEURVbUsIdh2wbianTBTnr9jRFwBHL1MUKP2SJ4SGuFMWzr/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "width", "85%");
    			attr_dev(iframe, "height", "90%");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			add_location(iframe, file$3, 22, 4, 604);
    			attr_dev(main, "class", "comp-main svelte-18z4ixk");
    			add_location(main, file$3, 19, 0, 454);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			append_dev(main, t1);
    			append_dev(main, iframe);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Timeline', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;
    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Timeline> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						setTimeout(
    							() => {
    								$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    							},
    							10
    						);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != undefined) {
    					if (shown) $$invalidate(0, wrapper.style.opacity = "1", wrapper); else $$invalidate(0, wrapper.style.opacity = "0", wrapper);
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timeline",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get shown() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Statement.svelte generated by Svelte v3.44.0 */
    const file$2 = "src/pages/Statement.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div;
    	let h3;
    	let t1;
    	let iframe_1;
    	let iframe_1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			t1 = space();
    			iframe_1 = element("iframe");
    			add_location(h3, file$2, 26, 31, 695);
    			attr_dev(div, "class", "home");
    			add_location(div, file$2, 26, 4, 668);
    			if (!src_url_equal(iframe_1.src, iframe_1_src_value = "https://docs.google.com/document/d/e/2PACX-1vRRZUpi1iT5Y985vFjnNGqBZp76ljpfwoerFCHwHGe9sOLooYfrC2TMLxZLyPmX5LU75GSNyCe5kjmT/pub?embedded=true")) attr_dev(iframe_1, "src", iframe_1_src_value);
    			attr_dev(iframe_1, "title", "Artist Statement");
    			attr_dev(iframe_1, "id", "statement");
    			attr_dev(iframe_1, "class", "svelte-1xxwifh");
    			add_location(iframe_1, file$2, 27, 4, 719);
    			attr_dev(main, "class", "comp-main svelte-1xxwifh");
    			add_location(main, file$2, 25, 0, 619);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			append_dev(main, t1);
    			append_dev(main, iframe_1);
    			/*iframe_1_binding*/ ctx[4](iframe_1);
    			/*main_binding*/ ctx[5](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*iframe_1_binding*/ ctx[4](null);
    			/*main_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Statement', slots, []);
    	let { shown = false } = $$props;
    	const def = v => v != null && v != undefined;
    	let wrapper;
    	let iframe; // = document.createElement("iframe");

    	onMount(() => {
    		
    	});

    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Statement> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function iframe_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			iframe = $$value;
    			$$invalidate(1, iframe);
    		});
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(2, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(2, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ onMount, shown, def, wrapper, iframe });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(2, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    		if ('iframe' in $$props) $$invalidate(1, iframe = $$props.iframe);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 5) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						setTimeout(
    							() => {
    								$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    							},
    							10
    						);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*wrapper, shown*/ 5) {
    			{
    				if (wrapper != undefined) {
    					if (shown) $$invalidate(0, wrapper.style.opacity = "1", wrapper); else $$invalidate(0, wrapper.style.opacity = "0", wrapper);
    				}
    			}
    		}
    	};

    	return [wrapper, iframe, shown, click_handler, iframe_1_binding, main_binding];
    }

    class Statement extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { shown: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Statement",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get shown() {
    		throw new Error("<Statement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Statement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Secret.svelte generated by Svelte v3.44.0 */
    const file$1 = "src/pages/Secret.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div;
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			t1 = space();
    			iframe = element("iframe");
    			add_location(h3, file$1, 25, 31, 596);
    			attr_dev(div, "class", "home");
    			add_location(div, file$1, 25, 4, 569);
    			attr_dev(iframe, "class", "tetris svelte-ovoo46");
    			if (!src_url_equal(iframe.src, iframe_src_value = "http://sandywalker.github.io/Tetris/")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			add_location(iframe, file$1, 26, 4, 620);
    			attr_dev(main, "class", "comp-main svelte-ovoo46");
    			add_location(main, file$1, 24, 0, 520);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			append_dev(main, t1);
    			append_dev(main, iframe);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Secret', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;

    	onMount(() => {
    		
    	});

    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Secret> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ onMount, shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						setTimeout(
    							() => {
    								$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    							},
    							10
    						);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != undefined) {
    					if (shown) $$invalidate(0, wrapper.style.opacity = "1", wrapper); else $$invalidate(0, wrapper.style.opacity = "0", wrapper);
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class Secret extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Secret",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get shown() {
    		throw new Error("<Secret>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Secret>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.0 */
    const file = "src/App.svelte";

    // (114:0) {#if show0}
    function create_if_block_5(ctx) {
    	let gallery;
    	let current;

    	gallery = new Gallery({
    			props: { shown: /*bind_show0*/ ctx[0] },
    			$$inline: true
    		});

    	gallery.$on("click", /*click_handler_6*/ ctx[24]);

    	const block = {
    		c: function create() {
    			create_component(gallery.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gallery, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gallery_changes = {};
    			if (dirty[0] & /*bind_show0*/ 1) gallery_changes.shown = /*bind_show0*/ ctx[0];
    			gallery.$set(gallery_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gallery.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gallery.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gallery, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(114:0) {#if show0}",
    		ctx
    	});

    	return block;
    }

    // (115:0) {#if show1}
    function create_if_block_4(ctx) {
    	let bestart;
    	let current;

    	bestart = new BestArt({
    			props: { shown: /*bind_show1*/ ctx[1] },
    			$$inline: true
    		});

    	bestart.$on("click", /*click_handler_7*/ ctx[25]);

    	const block = {
    		c: function create() {
    			create_component(bestart.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bestart, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bestart_changes = {};
    			if (dirty[0] & /*bind_show1*/ 2) bestart_changes.shown = /*bind_show1*/ ctx[1];
    			bestart.$set(bestart_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bestart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bestart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bestart, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(115:0) {#if show1}",
    		ctx
    	});

    	return block;
    }

    // (116:0) {#if show2}
    function create_if_block_3(ctx) {
    	let aboutme;
    	let current;

    	aboutme = new AboutMe({
    			props: { shown: /*bind_show2*/ ctx[2] },
    			$$inline: true
    		});

    	aboutme.$on("click", /*click_handler_8*/ ctx[26]);

    	const block = {
    		c: function create() {
    			create_component(aboutme.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(aboutme, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const aboutme_changes = {};
    			if (dirty[0] & /*bind_show2*/ 4) aboutme_changes.shown = /*bind_show2*/ ctx[2];
    			aboutme.$set(aboutme_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aboutme.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aboutme.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(aboutme, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(116:0) {#if show2}",
    		ctx
    	});

    	return block;
    }

    // (117:0) {#if show3}
    function create_if_block_2(ctx) {
    	let statement;
    	let current;

    	statement = new Statement({
    			props: { shown: /*bind_show3*/ ctx[3] },
    			$$inline: true
    		});

    	statement.$on("click", /*click_handler_9*/ ctx[27]);

    	const block = {
    		c: function create() {
    			create_component(statement.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(statement, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const statement_changes = {};
    			if (dirty[0] & /*bind_show3*/ 8) statement_changes.shown = /*bind_show3*/ ctx[3];
    			statement.$set(statement_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statement.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statement.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(statement, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(117:0) {#if show3}",
    		ctx
    	});

    	return block;
    }

    // (118:0) {#if show4}
    function create_if_block_1(ctx) {
    	let timeline;
    	let current;

    	timeline = new Timeline({
    			props: { shown: /*bind_show4*/ ctx[4] },
    			$$inline: true
    		});

    	timeline.$on("click", /*click_handler_10*/ ctx[28]);

    	const block = {
    		c: function create() {
    			create_component(timeline.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(timeline, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timeline_changes = {};
    			if (dirty[0] & /*bind_show4*/ 16) timeline_changes.shown = /*bind_show4*/ ctx[4];
    			timeline.$set(timeline_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timeline.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timeline.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(timeline, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(118:0) {#if show4}",
    		ctx
    	});

    	return block;
    }

    // (119:0) {#if show5}
    function create_if_block(ctx) {
    	let secret;
    	let current;

    	secret = new Secret({
    			props: { shown: /*bind_show5*/ ctx[5] },
    			$$inline: true
    		});

    	secret.$on("click", /*click_handler_11*/ ctx[29]);

    	const block = {
    		c: function create() {
    			create_component(secret.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(secret, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const secret_changes = {};
    			if (dirty[0] & /*bind_show5*/ 32) secret_changes.shown = /*bind_show5*/ ctx[5];
    			secret.$set(secret_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(secret.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(secret.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(secret, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(119:0) {#if show5}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div7;
    	let div6;
    	let div0;
    	let t3;
    	let div1;
    	let t5;
    	let div2;
    	let t7;
    	let div3;
    	let t9;
    	let div4;
    	let t11;
    	let div5;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let if_block5_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*show0*/ ctx[6] && create_if_block_5(ctx);
    	let if_block1 = /*show1*/ ctx[7] && create_if_block_4(ctx);
    	let if_block2 = /*show2*/ ctx[8] && create_if_block_3(ctx);
    	let if_block3 = /*show3*/ ctx[9] && create_if_block_2(ctx);
    	let if_block4 = /*show4*/ ctx[10] && create_if_block_1(ctx);
    	let if_block5 = /*show5*/ ctx[11] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Jacoby's Art Porfolio";
    			t1 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			div0.textContent = "Gallery";
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "Best Art";
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "About Me";
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "Artist Statement";
    			t9 = space();
    			div4 = element("div");
    			div4.textContent = "Art History Timeline";
    			t11 = space();
    			div5 = element("div");
    			div5.textContent = "Secret";
    			t13 = space();
    			if (if_block0) if_block0.c();
    			t14 = space();
    			if (if_block1) if_block1.c();
    			t15 = space();
    			if (if_block2) if_block2.c();
    			t16 = space();
    			if (if_block3) if_block3.c();
    			t17 = space();
    			if (if_block4) if_block4.c();
    			t18 = space();
    			if (if_block5) if_block5.c();
    			if_block5_anchor = empty();
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-7g59dj");
    			add_location(h1, file, 100, 1, 2834);
    			attr_dev(div0, "class", "menu-txt svelte-7g59dj");
    			add_location(div0, file, 103, 3, 3032);
    			attr_dev(div1, "class", "menu-txt svelte-7g59dj");
    			add_location(div1, file, 104, 3, 3099);
    			attr_dev(div2, "class", "menu-txt svelte-7g59dj");
    			add_location(div2, file, 105, 3, 3167);
    			attr_dev(div3, "class", "menu-txt svelte-7g59dj");
    			add_location(div3, file, 106, 3, 3235);
    			attr_dev(div4, "class", "menu-txt svelte-7g59dj");
    			add_location(div4, file, 107, 3, 3311);
    			attr_dev(div5, "class", "secret-txt svelte-7g59dj");
    			add_location(div5, file, 108, 3, 3391);
    			attr_dev(div6, "id", "menu-txt-wrapper");
    			attr_dev(div6, "class", "svelte-7g59dj");
    			add_location(div6, file, 102, 2, 3001);
    			attr_dev(div7, "id", "background");
    			attr_dev(div7, "class", "svelte-7g59dj");
    			add_location(div7, file, 101, 1, 2877);
    			attr_dev(main, "id", "main-wrapper");
    			attr_dev(main, "class", "svelte-7g59dj");
    			add_location(main, file, 99, 0, 2808);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div6, t3);
    			append_dev(div6, div1);
    			append_dev(div6, t5);
    			append_dev(div6, div2);
    			append_dev(div6, t7);
    			append_dev(div6, div3);
    			append_dev(div6, t9);
    			append_dev(div6, div4);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			insert_dev(target, t13, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t14, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t15, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t16, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t17, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t18, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, if_block5_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handle_key_down*/ ctx[17], false, false, false),
    					listen_dev(div0, "click", /*click_handler*/ ctx[18], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[19], false, false, false),
    					listen_dev(div2, "click", /*click_handler_2*/ ctx[20], false, false, false),
    					listen_dev(div3, "click", /*click_handler_3*/ ctx[21], false, false, false),
    					listen_dev(div4, "click", /*click_handler_4*/ ctx[22], false, false, false),
    					listen_dev(div5, "click", /*click_handler_5*/ ctx[23], false, false, false),
    					listen_dev(div7, "click", self(/*toggle_background*/ ctx[12]), false, false, false),
    					listen_dev(div7, "mouseenter", /*enter_background*/ ctx[13], false, false, false),
    					listen_dev(div7, "mouseleave", /*leave_background*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*show0*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*show0*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t14.parentNode, t14);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*show1*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*show1*/ 128) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t15.parentNode, t15);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*show2*/ ctx[8]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*show2*/ 256) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t16.parentNode, t16);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*show3*/ ctx[9]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*show3*/ 512) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t17.parentNode, t17);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*show4*/ ctx[10]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*show4*/ 1024) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(t18.parentNode, t18);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*show5*/ ctx[11]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty[0] & /*show5*/ 2048) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(if_block5_anchor.parentNode, if_block5_anchor);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t13);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t14);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t15);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t16);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t17);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t18);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(if_block5_anchor);
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
    	let bind_show0 = false;
    	let bind_show1 = false;
    	let bind_show2 = false;
    	let bind_show3 = false;
    	let bind_show4 = false;
    	let bind_show5 = false;
    	let show0 = false;
    	let show1 = false;
    	let show2 = false;
    	let show3 = false;
    	let show4 = false;
    	let show5 = false;

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

    	const load_menu = num => {
    		if (num == 0) $$invalidate(0, bind_show0 = true); else if (num == 1) $$invalidate(1, bind_show1 = true); else if (num == 2) $$invalidate(2, bind_show2 = true); else if (num == 3) $$invalidate(3, bind_show3 = true); else if (num == 4) $$invalidate(4, bind_show4 = true); else if (num == 5) $$invalidate(5, bind_show5 = true);
    		if (num == 0) $$invalidate(6, show0 = true); else if (num == 1) $$invalidate(7, show1 = true); else if (num == 2) $$invalidate(8, show2 = true); else if (num == 3) $$invalidate(9, show3 = true); else if (num == 4) $$invalidate(10, show4 = true); else if (num == 5) $$invalidate(11, show5 = true);
    		main_wrapper.style.transform = "translate(-100%, 0)";
    	}; // setTimeout(() => { toggle_background(); }, 300);

    	// setTimeout(() => { toggle_background(); load_menu(0); }, 500);
    	const hide_component = num => {
    		if (num == 0) $$invalidate(0, bind_show0 = false); else if (num == 1) $$invalidate(1, bind_show1 = false); else if (num == 2) $$invalidate(2, bind_show2 = false); else if (num == 3) $$invalidate(3, bind_show3 = false); else if (num == 4) $$invalidate(4, bind_show4 = false); else if (num == 5) $$invalidate(5, bind_show5 = false);

    		setTimeout(
    			() => {
    				if (num == 0) $$invalidate(6, show0 = false); else if (num == 1) $$invalidate(7, show1 = false); else if (num == 2) $$invalidate(8, show2 = false); else if (num == 3) $$invalidate(9, show3 = false); else if (num == 4) $$invalidate(10, show4 = false); else if (num == 5) $$invalidate(11, show5 = false);
    			},
    			510
    		);

    		main_wrapper.style.transform = "translate(0, 0)";
    	};

    	const handle_key_down = e => {
    		if (e.key != "Escape") return;
    		$$invalidate(0, bind_show0 = false);
    		$$invalidate(1, bind_show1 = false);
    		$$invalidate(2, bind_show2 = false);
    		$$invalidate(3, bind_show3 = false);
    		$$invalidate(4, bind_show4 = false);
    		$$invalidate(5, bind_show5 = false);
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
    	const click_handler_4 = () => load_menu(4);
    	const click_handler_5 = () => load_menu(5);
    	const click_handler_6 = () => hide_component(0);
    	const click_handler_7 = () => hide_component(1);
    	const click_handler_8 = () => hide_component(2);
    	const click_handler_9 = () => hide_component(3);
    	const click_handler_10 = () => hide_component(4);
    	const click_handler_11 = () => hide_component(5);

    	$$self.$capture_state = () => ({
    		onMount,
    		Gallery,
    		AboutMe,
    		BestArt,
    		Timeline,
    		Statement,
    		Secret,
    		background,
    		main_wrapper,
    		background_out,
    		bind_show0,
    		bind_show1,
    		bind_show2,
    		bind_show3,
    		bind_show4,
    		bind_show5,
    		show0,
    		show1,
    		show2,
    		show3,
    		show4,
    		show5,
    		toggle_background,
    		enter_background,
    		leave_background,
    		load_menu,
    		hide_component,
    		handle_key_down
    	});

    	$$self.$inject_state = $$props => {
    		if ('background' in $$props) background = $$props.background;
    		if ('main_wrapper' in $$props) main_wrapper = $$props.main_wrapper;
    		if ('background_out' in $$props) background_out = $$props.background_out;
    		if ('bind_show0' in $$props) $$invalidate(0, bind_show0 = $$props.bind_show0);
    		if ('bind_show1' in $$props) $$invalidate(1, bind_show1 = $$props.bind_show1);
    		if ('bind_show2' in $$props) $$invalidate(2, bind_show2 = $$props.bind_show2);
    		if ('bind_show3' in $$props) $$invalidate(3, bind_show3 = $$props.bind_show3);
    		if ('bind_show4' in $$props) $$invalidate(4, bind_show4 = $$props.bind_show4);
    		if ('bind_show5' in $$props) $$invalidate(5, bind_show5 = $$props.bind_show5);
    		if ('show0' in $$props) $$invalidate(6, show0 = $$props.show0);
    		if ('show1' in $$props) $$invalidate(7, show1 = $$props.show1);
    		if ('show2' in $$props) $$invalidate(8, show2 = $$props.show2);
    		if ('show3' in $$props) $$invalidate(9, show3 = $$props.show3);
    		if ('show4' in $$props) $$invalidate(10, show4 = $$props.show4);
    		if ('show5' in $$props) $$invalidate(11, show5 = $$props.show5);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bind_show0,
    		bind_show1,
    		bind_show2,
    		bind_show3,
    		bind_show4,
    		bind_show5,
    		show0,
    		show1,
    		show2,
    		show3,
    		show4,
    		show5,
    		toggle_background,
    		enter_background,
    		leave_background,
    		load_menu,
    		hide_component,
    		handle_key_down,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

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
