import {z} from 'zod'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import mapboxgl from 'mapbox-gl'
import { useState, useRef } from 'react'
import { v4 as uuidv4 } from "uuid";
import { MapPin } from 'lucide-react';
import { Search } from 'lucide-react';


mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const searchSchema = z.object({
    location: z.string().min(1, "Location is required")
})

type onSearchProps={
    onSearch?: (
        location: string,
        coords?: [number, number]
    ) => void
}

type SearchFormData = z.infer<typeof searchSchema>

export default function SearchForm({onSearch}: onSearchProps) {
    const {register, handleSubmit, setValue, formState: {errors, isSubmitting}} = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema)
    })
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const sessionToken = useRef(uuidv4());
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const fetchSuggestions = async (query: string) => {
        try {
             const response = await fetch(
                `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
                query
                )}&country=us&poi_category=hospital&access_token=${mapboxgl.accessToken}&session_token=${sessionToken.current}`
            );

            if (!response.ok) {
            throw new Error(`Mapbox API error: ${response.statusText}`);
            }

            const result = await response.json();

            // if (onSearch) {
            // onSearch(data.location);
            // }

            // console.log("Searching for:", data.location);
            console.log("API Response:", result);
            setSuggestions(result.suggestions || []);
        } catch (error) {
            console.error("Autocomplete failed:", error);
        }
    }

    const handleLocationSearch = (e:React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setValue("location", query);

        if (!query) {
        setSuggestions([]);
        return;
        }
        if (query.length < 3) {
        setSuggestions([]);
        return;
        }

        // Clear previous debounce timer
        if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        }

        // Set new debounce timer
        debounceRef.current = setTimeout(() => {
        fetchSuggestions(query);
        }, 2000); // ⏳ wait 2000ms after typing

        
    };

     // Get details of selected suggestion
    const handleSelect = async (suggestion: any) => {
        try {
        const response = await fetch(
            `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?access_token=${mapboxgl.accessToken}&session_token=${sessionToken.current}`
        );

        if (!response.ok) {
            throw new Error(`Mapbox Retrieve API error: ${response.statusText}`);
        }

        const result = await response.json();
        const feature = result.features?.[0];

        if (feature) {
            setValue("location", feature.properties.name || feature.properties.place_formatted);
            setSuggestions([]);

            if (onSearch) {
            onSearch(
                feature.properties.name || feature.properties.place_formatted,
                feature.geometry.coordinates // [lng, lat]
            );

            }
            console.log("Selected coordinates:", feature.geometry.coordinates)
        }
        } catch (error) {
        console.error("Retrieve failed:", error);
        }
    };


    // This component renders a search form for location input
    return (
        <>
            <form onSubmit={handleSubmit(() => {})}>
                <div  className='z-9 w-full lg:max-w-2xl max-w-11/12 gap absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                    <Search className='absolute top-1 left-1 mt-2.5 ml-1.5'/>
                    <Input {...register("location")} 
                    type="search" 
                    id="location" 
                    name="location"
                    disabled={isSubmitting}
                    onChange={handleLocationSearch}
                    placeholder="Looking for a hospital in USA? Just Search..." 
                    className="bg-background h-13 pl-10 dark:bg-background "
                    />
                    
                    {/* <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className='cursor-pointer'
                    >
                        {isSubmitting ? 'Searching...' : 'Search'}
                    </Button> */}
                </div>
                {errors.location && <span className="error text-red-600">{errors.location.message}</span>}
                {/* Display error message if location is not provided */}

            </form>

            {suggestions.length > 0 && (
                <ul className="z-10 border rounded-md mt-0 lg:mt-10 shadow absolute top-1/2 left-1/4 lg:left-1/2 sm:right-0 transform -translate-x-1/6 lg:-translate-x-1/2 -translate-y-1/2 bg-accent p-2 h-64 overflow-y-auto lg:h-fit">
                {suggestions.map((s) => (
                    <div className="flex items-center gap-2 hover:bg-background hover:rounded-md cursor-pointer px-1 py-0.5 leading-none" key={s.mapbox_id}>
                        <MapPin className="h-4 w-4"/>
                        <li
                        // key={s.mapbox_id}
                        className="p-2 "
                        onMouseDown={() => handleSelect(s)}
                        >
                        {s.name}<br/> <span className='text-sm text-muted-foreground'>{s.place_formatted}</span>
                        </li>
                    </div>
                ))}
                </ul>
            )}
        </>
    )
}