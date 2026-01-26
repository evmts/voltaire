let idCounter = 0;

export const nextId = (): number => ++idCounter;

export const resetId = (): void => {
	idCounter = 0;
};
