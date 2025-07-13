import Paper from '@mui/material/Paper';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export const CustomAutocomplete = ({label, defaultValue, options, onChange, required}:any) => {
    
    return (<Autocomplete 
        sx={{ 
            width:"100%",
            background:"var(--background-color)",
            input: {
                color: 'var(--color)', 
            },
            
        }}
        slotProps={{
            popupIndicator: {
                sx: {
                    color: 'var(--color)',        
                    '&:hover': {
                        color: 'var(--color)',
                    },
                    '& button': {
                        color: 'var(--color)',
                    },
                },
            },
            clearIndicator: {
                sx: {
                    color: 'var(--color)',
                    '&:hover': {
                        color: 'var(--color)',
                    },
                },
            },
            
        }}
        slots={{
            paper: (props) => (
            <Paper
                {...props}
                sx={{
                    background: 'var(--background-color)', 
                    color:"var(--color)",
                }}
            />
            ),
        }}
        disablePortal
        
        options={options}
        renderInput={(params:any) => 
            <TextField 
                {...params}  label={label} value={params.value} required={required}
                slotProps={{
                    inputLabel: {
                        sx: {
                            color: 'var(--color)',
                        },
                    }
                }}
            />
        }
        defaultValue={defaultValue}
        onChange={onChange}
    />)
}