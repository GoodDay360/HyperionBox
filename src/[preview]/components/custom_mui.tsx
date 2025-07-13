import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';


export const CustomFormControlSelect = ({label ,value, onChange, required, MenuItemComponents}:{ 
    label:string, 
    value:any, 
    onChange:any, 
    required?:boolean,
    MenuItemComponents:any,
}) => {
    console.log(value)
    return (
        <FormControl sx={{ minWidth: "200px", width:"calc((100vw + 100vh) * 0.5 / 2)"}}>
            <InputLabel sx={{color:"var(--color)"}}>{label}</InputLabel>
            <Select required={required}
                sx={{color:"var(--color)", background:"var(--background-color-layer-1)"}}
                value={value}
                onChange={(e) => onChange(e)}
                input={<OutlinedInput label={label}/>}
                MenuProps={{
                    PaperProps: {
                        style: {
                            maxHeight: "calc((100vw + 100vh) * 0.4 / 2)",
                            width: "calc((100vw + 100vh) * 0.3 / 2)",
                            background:"var(--background-color-layer-1)",
                            color:"var(--color)",
                        },
                    },
                }}
            >
                {MenuItemComponents}
            </Select>
        </FormControl>
)};