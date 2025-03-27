

import { lazy, useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router";
import {  error } from '@tauri-apps/plugin-log';



// Material UI
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Material UI Icons
import ViewListIcon from '@mui/icons-material/ViewList';
import HistoryIcon from '@mui/icons-material/History';
import ExploreIcon from '@mui/icons-material/Explore';
import ExtensionIcon from '@mui/icons-material/Extension';
import SettingsIcon from '@mui/icons-material/Settings';


// Style import
import 'bootstrap/dist/css/bootstrap-reboot.min.css';
import 'react-virtualized/styles.css';
import "../../global/styles/global.css";
import styles from "../styles/main.module.css";

// Custom Import
import load_config_options from '../scripts/load_config_options';
import { check_fullscreen, check_resize } from '../scripts/keys_event_listener';

// Context Imports
import global_context from '../../global/scripts/contexts';


// Components Import
const Watchlist = lazy(() => import('../../watchlist/components/main'));
const Splash_Screen = lazy(() => import('../../splash_screen/components/main'));
const Explore = lazy(() => import('../../explore/components/main'));
const Preview = lazy(() => import('../../[preview]/components/main'));

const theme = createTheme({
    typography: {
        fontFamily: "var(--font-family-medium)",
    },
});


function App() {
	const navigate = useNavigate();
	const [fullscreen_snackbar, set_fullscreen_snackbar] = useState<any>({});
	const [menu, set_menu] = useState<any>({state:false,path:""});

	const [app_ready, set_app_ready ] = useState<boolean>(false);

	const menu_button_top:any = [{title:"Watchlist", path:"watchlist", icon:ViewListIcon},{title:"History", path:"history", icon:HistoryIcon},{title:"Explore", path:"explore", icon:ExploreIcon}];
	const menu_button_bottom:any = [{title:"Extensions", path:"extensions", icon:ExtensionIcon},{title:"Settings", path:"settings", icon:SettingsIcon}];


	useEffect(()=>{
		navigate(`/${menu.path}`);
	},[menu])

	const is_run = useRef<boolean>(false);
	useEffect(()=>{
		if (!app_ready) return;
		if (is_run.current) return
		is_run.current = true;
		(async ()=>{
			await load_config_options();
			await check_fullscreen({fullscreen_snackbar, set_fullscreen_snackbar});
			await check_resize();
			set_menu({state:true,path:"watchlist"});
			
		})();
	},[app_ready])

	useEffect(()=>{
	(async () => {
		try{
		}catch{(e:unknown)=>{
			if (e instanceof Error) {
				// Log the error message if it's an instance of Error
				error(e.message);
			} else {
				// Handle other types of errors (if necessary)
				error('An unknown error occurred');
			}
		}}
		
		});
		
	},[])

	return (<ThemeProvider theme={theme}>
		<CssBaseline />
		<global_context.Provider 
			value={{
				...{fullscreen_snackbar, set_fullscreen_snackbar},
				...{app_ready, set_app_ready},
			}}
		>
			<div className={styles.container}>
				<>{menu.state &&
					<div className={styles.menu_container}>
						<div className={styles.menu}>
							{menu_button_top.map((item:any, index:number) => (
								<Tooltip title={item.title} placement="right" key={index}>
									<IconButton disabled={menu.path === item.path}
										sx={{
											background: menu.path === item.path ? "var(--selected-menu-background-color)": "var(--background-color-layer-1)",
											borderRadius: 12.5,
											"&:disabled": {
												backgroundColor: "var(--selected-menu-background-color)",
											},
										}}
										onClick={() => {set_menu({...menu,path:item.path})}}
									>
										<item.icon sx={{color: "var(--color)", fontSize: "1.5rem"}}/>
									</IconButton>
								</Tooltip>
							))}
						</div>
						<div className={styles.menu} style={{alignSelf: "flex-end"}}>
							{menu_button_bottom.map((item:any, index:number) => (
								<Tooltip title={item.title} placement="right" key={index}>
									<IconButton  disabled={menu.path === item.path}
										sx={{
											background: menu.path === item.path ? "var(--selected-menu-background-color)": "var(--background-color-layer-1)",
											borderRadius: 12.5,
											"&:disabled": {
												backgroundColor: "var(--selected-menu-background-color)",
											},
										}}
										onClick={() => {set_menu({...menu,path:item.path})}}
									>
										<item.icon sx={{color: "var(--color)", fontSize: "1.5rem"}}/>
									</IconButton>
								</Tooltip>
							))}
						</div>
					</div>
				}</>
				
				<Routes>
					<Route path="/" element={<Splash_Screen/>}/>
					<Route path="/watchlist/*" element={<Watchlist/>} />
					<Route path="/explore/*" element={<Explore/>} />
					<Route path="/preview/:source_id/:preview_id" element={<Preview/>} />
				</Routes>
				{/* Fullscreen event listener snackbar */}
				<Snackbar 
					open={fullscreen_snackbar.state} 
					autoHideDuration={6000} 
					onClose={()=>{set_fullscreen_snackbar({...fullscreen_snackbar, state: false})}}
					anchorOrigin={{ vertical:"bottom", horizontal:"right" }}
				>
					<Alert
						onClose={()=>{set_fullscreen_snackbar({...fullscreen_snackbar, state: false})}}
						severity={fullscreen_snackbar.severity || "info"}
						variant={fullscreen_snackbar.variant || "filled"}
						sx={{ width: '100%', color: "white" }}
					>
						{fullscreen_snackbar.text}
					</Alert>
				</Snackbar>
				{/* ================ */}
			</div>
		</global_context.Provider>
		
	</ThemeProvider>);
}

export default App;
