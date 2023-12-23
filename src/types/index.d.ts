interface Bookmark {
    name: string;
    url: string;
}

interface TermCoord {
    name: string;
    top: string;
    left: string;
}

interface LocationObject {
    country: string;
    id: number;
    lat: number;
    lon: number;
    name: string;
    region?: string;
    url: string;
}