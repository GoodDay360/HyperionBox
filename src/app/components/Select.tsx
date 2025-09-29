// SolidJS Type Imports
import type { JSX, Accessor } from 'solid-js';

// SUID Imports
import { 
    FormControl, InputLabel, Select as SUIDSelect

} from '@suid/material';


// SUID Type Imports
import type { SelectChangeEvent } from '@suid/material/Select';
import type { SxProps } from '@suid/system';

export default function Select(props: {
    label: string,
    value: string|number|undefined,
    onChange?: (e: SelectChangeEvent<any>) => void,
    children?: JSX.Element,
    select_sx?: SxProps,
    required?: boolean,
    disabled?: boolean
}) {
    
    return <FormControl fullWidth required={props.required ?? false} disabled={props.disabled ?? false}>
        <InputLabel id={props.label}
            sx={{
                color: 'var(--color-1)',
                fontSize: 'max(12px, calc((100vw + 100vh)/2*0.0175))',
                fontWeight: '500',
                userSelect: 'none',
            }}
        >{props.label}</InputLabel>
        <SUIDSelect
            labelId={props.label}
            value={props.value}
            label={props.label}
            onChange={props.onChange}  
            sx={{
                ...{
                    color: 'var(--color-1)',
                    fontSize: 'max(12px, calc((100vw + 100vh)/2*0.0175))',
                    fontWeight: '500',
                    background: 'var(--background-2)',
                    "& .MuiSvgIcon-root": {
                        color: "var(--color-1)"
                    },
                },
                ...props.select_sx
            }}
            MenuProps={{
                PaperProps: {
                    sx: {
                        color: 'var(--color-1)',
                        background: 'var(--background-3)',
                        fontSize: 'max(12px, calc((100vw + 100vh)/2*0.0175))',
                        maxHeight: "calc((100vw + 100vh)/2*0.4)",
                    },
                },
            }}
        >
            {props.children}
        </SUIDSelect>
    </FormControl>
}