from abc import ABC, abstractmethod


class LocationProvider(ABC):
    @abstractmethod
    def nearby_search(self, latitude, longitude, place_type, radius):
        raise NotImplementedError

    @abstractmethod
    def text_search(self, query):
        raise NotImplementedError
