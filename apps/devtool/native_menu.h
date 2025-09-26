#ifndef NATIVE_MENU_H
#define NATIVE_MENU_H

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

void createApplicationMenu(void);
void setMainWindow(size_t window);
void setWebuiRunFunction(void (*func)(size_t, const char*));

#ifdef __cplusplus
}
#endif

#endif // NATIVE_MENU_H