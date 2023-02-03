import React, { useEffect } from 'react';
import googleLogo from '../../assets/google.png';

const SearchResults = () => {
    useEffect(() => {}, []);
    return (
        <div>
            <div className="px-5 py-8 flex flex-row items-center border-b ">
                <img src={googleLogo} alt="google logo" className="w-24 mr-10" />
                <input
                    type="text"
                    className="w-1/2 p-2 px-6 rounded-full shadow-gray-300 shadow-sm border border-gray-100 transition-all focus:shadow-md"
                    placeholder="Search..."
                    // value={query}
                    // onChange={(event) => setQuery(event.target.value)}
                />
            </div>
        </div>
    );
};
export default SearchResults;
