import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import AvatarModal from '../../Components/AvatarModal';
import useDebounce from '../../hooks/useDebounce';
import { baseURL } from '@/Utils/URL';

interface Avatar {
    avatar_id: string;
    avatar_name: string;
    gender: string;
    preview_image_url: string;
    preview_video_url: string;
    premium: boolean;
}

interface Voice {
    voice_id: string;
    name: string;
    preview_url: string;
    description: string;
    category: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
}

const AvatarPage = () => {
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Debounce search term by 500ms
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Fetch avatars with search
    const fetchAvatarsData = useCallback(async (page: number, search: string) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                ...(search && { search })
            });

            const response = await axios.get(
                `${baseURL}/api/v1/video/fetch-avatars?${queryParams}`,
                { withCredentials: true }
            );

            if (response.data.result === true) {
                setAvatars(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching avatars:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch voices once on mount
    const fetchVoicesData = useCallback(async () => {
        try {
            const response = await axios.get(
                `${baseURL}/api/v1/speech/voices/existing`,
                { withCredentials: true }
            );

            if (response.data.result === true) {
                setVoices(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching voices:', error);
        }
    }, []);

    // Fetch avatars when currentPage or debouncedSearchTerm changes
    useEffect(() => {
        fetchAvatarsData(currentPage, debouncedSearchTerm);
    }, [currentPage, debouncedSearchTerm, fetchAvatarsData]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        if (debouncedSearchTerm) {
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm]);

    // Fetch voices once on mount
    useEffect(() => {
        fetchVoicesData();
    }, [fetchVoicesData]);

    const handlePageChange = (page: number) => {

        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAvatarClick = (avatar: Avatar) => {
        setSelectedAvatar(avatar);
        setIsModalOpen(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisible = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-center gap-2 mt-8 relative z-10">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev || loading}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pointer-events-auto"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors pointer-events-auto disabled:opacity-50"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="text-gray-400">...</span>}
                    </>
                )}

                {pageNumbers.map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg transition-colors pointer-events-auto ${
                            currentPage === page
                                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 text-white font-semibold'
                                : 'bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < pagination.totalPages && (
                    <>
                        {endPage < pagination.totalPages - 1 && <span className="text-gray-400">...</span>}
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors pointer-events-auto disabled:opacity-50"
                        >
                            {pagination.totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pointer-events-auto"
                >
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-4">Select Your Avatar</h1>
                    
                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search by name or gender..."
                            className="w-full pl-12 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Info */}
                    <p className="text-gray-400 mt-4">
                        {searchTerm && `Search results for "${searchTerm}" - `}
                        Page {pagination.currentPage} of {pagination.totalPages} - 
                        Showing {avatars.length} of {pagination.totalCount} avatars
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                ) : avatars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Search className="w-16 h-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No avatars found</h3>
                        <p className="text-gray-400">
                            {searchTerm 
                                ? `No results for "${searchTerm}". Try a different search term.`
                                : 'No avatars available at the moment.'}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Avatar Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {avatars.map((avatar) => (
                                <div
                                    key={avatar.avatar_id}
                                    className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer transition-transform hover:scale-105"
                                    onClick={() => handleAvatarClick(avatar)}
                                >
                                    <img
                                        src={avatar.preview_image_url}
                                        alt={avatar.avatar_name}
                                        className="w-full h-full object-cover transition-opacity group-hover:opacity-40"
                                    />
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 rounded-lg text-white font-medium pointer-events-none">
                                            Select
                                        </button>
                                    </div>

                                    {/* Avatar Name */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                        <p className="text-white font-medium text-sm truncate">
                                            {avatar.avatar_name}
                                        </p>
                                        <p className="text-gray-300 text-xs capitalize">
                                            {avatar.gender}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && renderPagination()}
                    </>
                )}
            </div>

            {/* Avatar Modal */}
            <AvatarModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                avatar={selectedAvatar}
                voices={voices}
            />
        </div>
    );
};

export default AvatarPage;
