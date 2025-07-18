

import { lazy, useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router";


// Material UI
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Material UI Icons
import ViewListIcon from '@mui/icons-material/ViewList';
import ExploreIcon from '@mui/icons-material/Explore';
import ExtensionIcon from '@mui/icons-material/Extension';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadForOfflineRoundedIcon from '@mui/icons-material/DownloadForOfflineRounded';

// Style import
import 'bootstrap/dist/css/bootstrap-reboot.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-virtualized/styles.css';
import "../../global/styles/global.css";
import styles from "../styles/main.module.css";

// Custom Import
import load_config_options from '../scripts/load_config_options';
import { check_fullscreen, check_resize } from '../scripts/keys_event_listener';
import { read_config } from "../../global/scripts/manage_config";
// Context Imports
import { global_context, download_task_context } from '../../global/scripts/contexts';

// Worker Imports
import download_task_worker from "../../download_task/worker/download_task_worker";

// Components Import
const Watchlist = lazy(() => import('../../watchlist/components/main'));
const Splash_Screen = lazy(() => import('../../splash_screen/components/main'));
const Explore = lazy(() => import('../../explore/components/main'));
const Preview = lazy(() => import('../../[preview]/components/main'));
const Watch = lazy(() => import('../../[watch]/components/main'));
const DownloadTask = lazy(()=> import('../../download_task/components/main'))
const Extension = lazy(() => import('../../extension/components/main'));
const Setting = lazy(() => import('../../setting/components/main'));
const BrowseSource = lazy(() => import('../../explore/components/[browse_source]'));

const theme = createTheme({
    typography: {
        fontFamily: "var(--font-family-medium)",
    },
});


let FIRST_RUN_TIMEOUT:any;

function App() {
	const navigate = useNavigate();

	const [fullscreen_snackbar, set_fullscreen_snackbar] = useState<any>({state:false,text:""});
	const [feedback_snackbar, set_feedback_snackbar] = useState<any>({});
	const [menu, set_menu] = useState<any>({state:false,path:""});

	const [app_ready, set_app_ready] = useState<boolean>(false);
	const [allow_use_app, set_allow_use_app] = useState<boolean>(true);

	const pause_download_task = useRef<boolean>(false);
	const download_task_info = useRef<any>({});
	const download_task_progress = useRef<any>({});

	const menu_button_top:any = [{title:"Watchlist", path:"watchlist", icon:ViewListIcon},{title:"Explore", path:"explore", icon:ExploreIcon}];
	const menu_button_bottom:any = [{title:"Download Task", path:"download_task", icon:DownloadForOfflineRoundedIcon },{title:"Extension", path:"extension", icon:ExtensionIcon},{title:"Setting", path:"setting", icon:SettingsIcon}];
	


	useEffect(()=>{
		navigate(`/${menu.path}`);
		// navigate("/preview/hianime/solo-leveling-season-2-arise-from-the-shadow-19413");
	},[menu])

	useEffect(()=>{
		if (!app_ready) return;
		clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
			await load_config_options();
			await check_fullscreen({fullscreen_snackbar, set_fullscreen_snackbar});
			await check_resize();
			const config = await read_config();
			pause_download_task.current = config.pause_download_task ? true : false;
			download_task_worker({pause_download_task,download_task_info,download_task_progress});
			set_menu({state:true,path:"watchlist"});
			

		}, import.meta.env.DEV ? 1500 : 0);
		return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
	},[app_ready])

	return (<ThemeProvider theme={theme}>
		<CssBaseline />
		<global_context.Provider 
			value={{
				...{fullscreen_snackbar, set_fullscreen_snackbar},
				...{feedback_snackbar, set_feedback_snackbar},
				...{app_ready, set_app_ready},
				...{allow_use_app, set_allow_use_app},
				...{menu, set_menu},
			}}
		>
			<download_task_context.Provider
						value={{
							...{pause_download_task, download_task_info,download_task_progress},
						}}
					>
				<div className={styles.container} style={{pointerEvents: allow_use_app ? "all" : "none"}}>
					<>{menu.state &&
						<div className={styles.menu_container}>
							<div className={styles.menu}>
								{menu_button_top.map((item:any, index:number) => 
									<Tooltip title={item.title} placement="right" key={index}>
										<IconButton
											sx={{
												background: menu.path === item.path ? "var(--selected-menu-background-color)": "var(--background-color-layer-1)",
												borderRadius: 12.5,
											}}
											onClick={() => {set_menu({...menu,path:item.path})}}
										>
											<item.icon sx={{color: "var(--color)", fontSize: "1.5rem"}}/>
										</IconButton>
									</Tooltip>
								)}
							</div>
							<div className={styles.menu} style={{alignSelf: "flex-end"}}>
								{menu_button_bottom.map((item:any, index:number) => 
									<Tooltip title={item.title} placement="right" key={index}>
										<IconButton
											sx={{
												background: menu.path === item.path ? "var(--selected-menu-background-color)": "var(--background-color-layer-1)",
												borderRadius: 12.5,
											}}
											onClick={() => {set_menu({...menu,path:item.path})}}
										>
											<item.icon sx={{color: "var(--color)", fontSize: "1.5rem"}}/>
										</IconButton>
									</Tooltip>
								)}
							</div>
						</div>
					}</>
					
					<Routes>
						<Route path="/" element={<Splash_Screen/>}/>
						<Route path="/watchlist/*" element={<Watchlist/>} />
						<Route path="/explore/*" element={<Explore/>}/>
						<Route path="/explore/:source_id/:search" element={<BrowseSource/>} />
						
						<Route path="/download_task/*" element={<DownloadTask/>} />
						
						<Route path="/preview/:source_id/:preview_id" element={<Preview />} />
						<Route path="/watch/:source_id/:preview_id/:season_id/:watch_id" element={<Watch />} />
						<Route path="/extension" element={<Extension />} />
						<Route path="/setting" element={<Setting />} />
					</Routes>

					
				</div>
			</download_task_context.Provider>
		</global_context.Provider>
		{/* Feedback snackbar  */}
		<Snackbar 
			sx={{
				zIndex: 999,
			}}
			open={feedback_snackbar.state} 
			
			autoHideDuration={6000} 
			onClose={()=>{set_feedback_snackbar({...feedback_snackbar, state: false})}}
			anchorOrigin={{ vertical:"bottom", horizontal:"right" }}
		>
			<Alert
				onClose={()=>{set_feedback_snackbar({...feedback_snackbar, state: false})}}
				severity={feedback_snackbar.type || "info"}
				variant={"filled"}
				sx={{ width: '100%', color: "white" }}
			>
				{feedback_snackbar.text}
			</Alert>
		</Snackbar>
		{/* ================  */}

		{/* Fullscreen event listener snackbar */}
		<Snackbar 
			sx={{
				zIndex: 999,
			}}
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
		
	</ThemeProvider>);
}

export default App;
