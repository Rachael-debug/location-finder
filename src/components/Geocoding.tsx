import {z} from 'zod'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import mapboxgl from 'mapbox-gl'
import { useState, useRef } from 'react'
import { v4 as uuidv4 } from "uuid";
import { MapPin } from 'lucide-react';

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

export default function GeocodeForm({onSearch}: onSearchProps) {
    const {register, handleSubmit, setValue, formState: {errors, isSubmitting}} = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema)
    })
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const sessionToken = useRef(uuidv4());
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const fetchSuggestions = async (query: string) => {
        try {
             const response = await fetch(
                `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
                query
                )}&country=NG&access_token=${mapboxgl.accessToken}`
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
                <div  className='flex w-full max-w-sm items-center gap-2 sm:mx-2'>
                    <Input {...register("location")} 
                    type="text" 
                    id="location" 
                    name="location"
                    disabled={isSubmitting}
                    onChange={handleLocationSearch}
                    placeholder="Search for a location..." 
                    // className="border p-2 w-9/12 m-auto rounded flex-1"
                    />
                    <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className='cursor-pointer'
                    >
                        {isSubmitting ? 'Searching...' : 'Search'}
                    </Button>
                </div>
                {errors.location && <span className="error text-red-600">{errors.location.message}</span>}
                {/* Display error message if location is not provided */}

            </form>

            {suggestions.length > 0 && (
                <ul className="absolute z-10 border rounded-md mt-1  shadow">
                {suggestions.map((s) => (
                    <div className="flex items-center gap-2 hover:bg-black cursor-pointer" key={s.mapbox_id}>
                        <MapPin className="h-4 w-4"/>
                        <li
                        // key={s.mapbox_id}
                        className="p-2 "
                        onMouseDown={() => handleSelect(s)}
                        >
                        {s.name} — {s.place_formatted}
                        </li>
                    </div>
                ))}
                </ul>
            )}
        </>
    )
}