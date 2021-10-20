<script>
	import { onMount } from "svelte";
	import Gallary from "./pages/Gallary.svelte";

	let background;
	let main_wrapper;
	onMount(()=>{ 
		background = document.getElementById("background"); 
		main_wrapper = document.getElementById("main-wrapper"); 
		// toggle_background();
	});

	let background_out = false;

	let show0 = false;

	const toggle_background = ()=>{
		if (background_out) background.style.clipPath = "circle(2% at 75% 50%)";
		else background.style.clipPath = "circle(100% at 75% 50%)";
		
		background_out = !background_out;
	}
	const enter_background = ()=>{
		if (!background_out) background.style.clipPath = "circle(3% at 75% 50%)";
	}
	const leave_background = ()=>{
		if (!background_out) background.style.clipPath = "circle(2% at 75% 50%)";
	}
	const load_menu = (i)=>{
		switch (i) {
			case 0:
				show0 = true;
				break;
			default:
				break;
		}

		main_wrapper.style.transform = "translate(-100%, 0)";
		// setTimeout(() => { toggle_background(); }, 300);
	}

	// setTimeout(() => { toggle_background(); load_menu(0); }, 500);


	const hide_gallary = ()=>{
		show0 = false;
		main_wrapper.style.transform = "translate(0, 0)";
	}
</script>

<main id="main-wrapper">
	<h1 id="title">Jacoby's Art Porfolio</h1>
	<div id="background" on:click|self={toggle_background} on:mouseenter={enter_background} on:mouseleave={leave_background}>
		<div id="menu-txt-wrapper">
			<div class="menu-txt" on:click={()=>load_menu(0)}>Gallary</div>
			<div class="menu-txt" on:click={()=>load_menu(1)}>Best Art</div>
			<div class="menu-txt" on:click={()=>load_menu(2)}>About Me</div>
			<div class="menu-txt" on:click={()=>load_menu(3)}>Art History Timeline</div>
		</div>
	</div>
</main>

<Gallary shown={show0} on:click={hide_gallary}/>

<style>
	#main-wrapper {
		-moz-user-select: none;
		-webkit-user-select: none;
		transition-duration: 0.5s;
		/* transition-timing-function: linear; */
		position: absolute;
		width: 100%; height: 100%;
	}
	#title {
		position: absolute;
		left: 50%; top: 50%;
		transform: translate(-50%, -50%);
		font-size: 3rem;
		color: white;
	}
	#background {
		position: absolute;
		background-color: #495b6f;
		width: 100%; height: 100%;
		clip-path: circle(2% at 75% 50%);
		transition-duration: 0.3s;
		display: grid;
		justify-items: center;
		align-items: center;
	}
	#menu-txt-wrapper {
		display: grid;
		width: max-content;
	}
	.menu-txt {
		padding: 1rem;
		font-weight: bold;
		font-size: 3rem;
		text-align: center;
		transition-duration: 0.2s;
		color: white;
	}
	.menu-txt:hover {
		font-size: 3.5rem;
	}
</style>