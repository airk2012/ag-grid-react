import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Button, useMantineTheme, Grid } from '@mantine/core';
import axios from 'axios'
import 'ag-grid-community/dist/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'; // Optional theme CSS
import 'ag-grid-enterprise';
import Swal from 'sweetalert2'
import './App.css';

const infoChanged = []
let savedState;
let savedPivotMode;

function App() {
  const gridRef = useRef(); // Optional - for accessing Grid's API
  const theme = useMantineTheme();
  const [rowData, setRowData] = useState([]); //Agregar info de las filas
  const [mode, setMode] = useState(false); //Modo lectura o edicion
  const [cellchanged, setCellChanged] = useState([]); //Agregar cambios den las celdas

  // Definicion de cada columna.
  const [columnDefs, setColumnDefs] = useState([
    {
      headerName: 'CÓDIGOS DEL PRODUCTO',
      children: [
        {field: 'athlete', filter: true, rowDrag: true },
        {field: 'age', type: 'numberColumn'},
        {field: 'country'}
      ],
    },
    {
      headerName: 'CODIGOS2',
      children: [
        {field: 'year', filter: 'agNumberColumnFilter'},
        {field: 'date', type: ['dateColumn', 'nonEditableColumn'], width: 220 }
      ]
    },
    {
      headerName: 'Medals',
      groupId: 'medalsGroup',
      children: [
        // using medal column type
        { headerName: 'Gold', field: 'gold', columnGroupShow: 'open' },
        { headerName: 'Silver', field: 'silver', type: 'medalColumn' },
        { headerName: 'Bronze', field: 'bronze', type: 'medalColumn' },
        { headerName: 'Total', field: 'total', type: 'medalColumn', columnGroupShow: 'closed'},
      ],
    }
  ]);

  //Ejemplo de agregado de otras columnas
  const getColumnDefs = () => {
    return [
      {
        headerName: 'CANAL DE MARCAS',
        children: [
          {field: 'Marca1', filter: true},
          {field: 'Marca2', filter: true},
          {field: 'Marca3'}
        ],
      },
    ];
  };

  //Agregar nuevas columnas
  const AddColumns = useCallback(() => {
    gridRef.current.api.setColumnDefs(getColumnDefs());
  }, []);


  // DefaultColDef sets props common to all Columns
  const defaultColDef = useMemo(() => {
    return {
      // set the default column width
      width: 150,
      // make every column editable
      editable: mode,
      filter: 'agTextColumnFilter', //Obliga a que las columnas
      // enable floating filters by default
      floatingFilter: true, //Permite mostrar el filtro debajo de la columna
      sortable: true, //Todos las columnas pueden sortear
      unSortIcon: true, //Muestra para poder sortear
      // flex: 1, aumentar tamano del filtro
      // minWidth: 200, 
      // resizable: true, //Permite expandir columnas
      // enableRowGroup: true, //Mas opciones de filtro
      // enablePivot: true, //Mas opciones de filtro
      // enableValue: true, //Mas opciones de filtro
    };
  }, [mode]);

  //Metodo para configurar los tipos de dato de celdas
  const columnTypes = useMemo(() => {
    return {
      numberColumn: { width: 130, filter: 'agNumberColumnFilter' },
      medalColumn: { width: 100, columnGroupShow: 'open', filter: false },
      nonEditableColumn: { editable: false },
      dateColumn: {
        // specify we want to use the date filter
        filter: 'agDateColumnFilter',
        // add extra parameters for the date filter
        filterParams: {
          // provide comparator function
          comparator: (filterLocalDateAtMidnight, cellValue) => {
            // In the example application, dates are stored as dd/mm/yyyy
            // We create a Date object for comparison against the filter date
            const dateParts = cellValue.split('/');
            const day = Number(dateParts[0]);
            const month = Number(dateParts[1]) - 1;
            const year = Number(dateParts[2]);
            const cellDate = new Date(year, month, day);
            // Now that both parameters are Date objects, we can compare
            if (cellDate < filterLocalDateAtMidnight) {
              return -1;
            } else if (cellDate > filterLocalDateAtMidnight) {
              return 1;
            } else {
              return 0;
            }
          },
        },
      },
    };
  }, []);


  // Cargar data del server
  useEffect(() => {
    axios.get('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(res => { 
      debugger;
      setRowData(res.data)
    }).catch((error) => {
      // Error
      console.log(error)
    });
  }, []);

  // Evento de click dentro de la celda
  const cellClickedListener = useCallback( event => {
    console.log('cellClicked', event);
  }, []);

  //Cambio de informacion dentro de la celda
  const onCellValueChanged = useCallback( event => {
    console.log('cambio', event);
    debugger;
    let auxPush = false
    if(infoChanged.length > 0){
      for (let i = 0; i < infoChanged.length; i++) {
        if(event.data[event.colDef.field] == infoChanged[i].value && event.colDef.field == infoChanged[i].name){
          infoChanged[i].new_value = event.newValue
          auxPush = true
          break;
        }
      }
      // infoChanged.filter(aux => {
      //   if(event.data.distributor_code == aux.code && event.colDef.field == aux.field){
      //     aux.new_value = event.newValue;
      //     auxPush = true;
      //   }
      // });
    }
    if(auxPush){
      setCellChanged([...infoChanged])
    }else{
      infoChanged.push({name: event.colDef.field, oldValue: event.oldValue, newValue: event.newValue, rowIndex: event.rowIndex})
      setCellChanged([...infoChanged])
    }
  }, []);

  //Consume el API para la actualizacion de informacion
  const UpdateInfo = () => {
    Swal.fire({
      title: '¡Estás segur@?',
      html: `Revisa los mensajes de chequeo antes de confirmar la carga, esta carga no se puede reversar`,
      showDenyButton: true,
      confirmButtonText: `Actualizar`,
      denyButtonText: `Cancelar`,
      confirmButtonColor: '#ea5455',
      denyButtonColor: '#777',
    }).then((result) => {
      if (result.isConfirmed) {  
        setCellChanged([])
        Swal.fire("Excelente", 'HA SIDO ACTUALIZADO', "success") 
      } 
    })
  }

  const sideBar = useMemo(() => {
    return {
      toolPanels: ['columns', 'filters'],
    };
  }, []);

  //Permite devolver el cambio de un valor al original
  const undoCell = (aux) => {
    debugger;
    const new_data = [...gridRef.current.props.rowData]
    new_data[aux.rowIndex][aux.name] = aux.oldValue
    gridRef.current.api.selectIndex(aux.rowIndex)
    setRowData(new_data)
  }

  //Permite almacenar la informacion para evitar perderla de los filtros
  const saveState = useCallback(() => {
    savedState = gridRef.current.columnApi.getColumnState();
    savedPivotMode = gridRef.current.columnApi.isPivotMode();
    localStorage.setItem("data", JSON.stringify(gridRef.current.props.rowData));
    console.log('generate order edition');
    debugger;
  }, []);

  //Permite restaurar la informacion una vez haya sido guardada temporalmente
  const restoreState = useCallback(() => {
    if (savedState) {
      // Pivot mode must be set first otherwise the columns we're trying to set state for won't exist yet
      gridRef.current.columnApi.setPivotMode(savedPivotMode);
      gridRef.current.columnApi.applyColumnState({
        state: savedState,
        applyOrder: true,
      });
      setRowData(JSON.parse(localStorage.data))
      console.log('column state restored');
    } else {
      console.log('no previous column state to restore!');
    }
  }, [savedState]);

  //Permite restablecer la informacion original
  const resetState = () => {
    gridRef.current.columnApi.resetColumnState();
    gridRef.current.columnApi.setPivotMode(false);
    setRowData([...gridRef.current.props.rowData])
    console.log('column state reset');
    debugger;
  };

  //Permite customizar las celdas
  // const ChildMessageRenderer = (props) => {
  //   const invokeParentMethod = () => {
  //     methodFromParent(props.data.value)
  //   };

  //   return (
  //     <>
  //     <span>
  //       <button
  //         style={{ height: 20, lineHeight: 0.5 }}
  //         onClick={invokeParentMethod}
  //         className="btn btn-info"
  //       >
  //         +
  //       </button>
  //     </span>
  //     {props.value}
  //     </>
  //   );
  // };

  // const methodFromParent = (cell) => {
  //   alert('Parent Component Method from ' + cell + '!');
  // };

  //Permite filtrar la informacion consultandola en la base de datos para mostrarla en la tabla
  // const onFilterChanged = params => {
  //   const setFilter = params.api.getFilterInstance(params.columns[0].colId);
  //   console.log('column state restored', setFilter);
  //   debugger;
  //   const filter_params = {filter: setFilter.appliedModel == null ? {} : setFilter.appliedModel }
  //   filter_params['filter']['inputType'] = setFilter.filterNameKey
  //   filter_params['filter']['field'] = params.columns[0].colId 
  //   axios.post('http://localhost:3000/api/v1/products/filter_products.json', filter_params )
  //   .then(res => { 
  //     // Sucess
  //     setRowData(res.data)
  //   }).catch((error) => {
  //     // Error
  //     console.log(error)
  //   });
  // };

 return (
   <div>

     {/* Example using Grid's API */}
     {/* <button onClick={AddColumns}>Agregar columnas</button> */}
     <Grid>
       <Grid.Col offset={2} span={1}>
         <Button onClick={event => setMode(true)}>Edición</Button>
       </Grid.Col>
       <Grid.Col span={1}>
         <Button onClick={event => setMode(false)}>Lectura</Button>
       </Grid.Col>
       <Grid.Col span={2}>
         <Button onClick={event => saveState()}>Guardado temporal filtros</Button>
       </Grid.Col>
       <Grid.Col span={2}>
         <Button onClick={event => restoreState()}>Restaurar filtros</Button>
       </Grid.Col>
       <Grid.Col span={1}>
         <Button onClick={event => resetState()}>Restaurar data original</Button>
       </Grid.Col>
     </Grid>

     <Grid>
       <Grid.Col offset={1} span={10}>
         {/* On div wrapping Grid a) specify theme CSS Class Class and b) sets Grid size */}
         <div id="myGrid" className="ag-theme-alpine" style={{width: 1000, height: 500}}>
           <AgGridReact
              ref={gridRef} // Ref for accessing Grid's API

              rowData={rowData} // Row Data for Rows

              columnDefs={columnDefs} // Column Defs for Columns
              defaultColDef={defaultColDef} // Default Column Properties
              columnTypes={columnTypes}
              popupParent={document.body}
              //  rowDragManaged={true} //Permite mover entre filas
              
              animateRows={true} // Optional - set to 'true' to have rows animate when sorted
              //  rowSelection='multiple' // Options - allows click selection of rows


              onCellClicked={cellClickedListener} // Optional - registering for Grid Event
              onCellValueChanged={onCellValueChanged}
              // onFilterChanged={onFilterChanged} // Manejo de filtros 

              sideBar={sideBar}
              
              //  rowGroupPanelShow={'always'}
              //  pivotPanelShow={'always'}
              />
         </div>
       </Grid.Col>
     </Grid>
     <Grid justify="center">
       <Grid.Col span={10}>
        {(cellchanged.length > 0) ? (
          <><p>Posibles cambios de información</p><ul>
            {cellchanged.map((aux, index) => {
              return (
                <li key={`updateinfo-${aux.rowIndex}`}>
                  <button onClick={event => undoCell(aux)}>Devolver</button>
                  <p><b>Nombre del campo:</b>{aux.name}</p>
                  <p><b>Texto anterior:</b>{aux.oldValue}</p>
                  <p><b>Texto nuevo:</b>{aux.newValue}</p>
                </li>
              );
            })}
          </ul>
          <Button onClick={event => UpdateInfo()}>Confirmar</Button>
          </>
          ) : <p></p>
          }
      </Grid.Col>
    </Grid>
   </div>
 );
}

export default App;
